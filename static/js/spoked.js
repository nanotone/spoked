var DEFAULT_SCROLL_LEFT = 20;
var DEFAULT_SCROLL_TOP = 970;

var initPromise = $.when(initData(), initRender());

var currentUser = null;
var gameState = '';
var activeGame = null;
var activeUsers;
var beforeGameTimeout = null;

function processingUpdatedTime(tstamp) {
	$('#animation-clock').show().text(formatLocaleString(new Date(tstamp*1000)));
}
function processingFinishedAnimating() {
	$('#animation-clock').hide();
	$('#animate').removeClass('selected');
}

////////////////////////////////////////////////////////////////////////////////
// history and the pickling and unpickling of state

function pickleState(state) {
	if (!('game' in state)) { state.game = activeGame.id; }
	if (!('view' in state)) { state.view = 'all'; }
	//if (games.length && state.game == games[0].id && state.view == 'all') { return ''; }
	if (state.view == 'user' && !('user' in state)) { state.user = authUserId; }
	var title = state.game;
	if (demoMode) {
		title += '-demo-' + authUserId;
	}
	if (state.view != 'all') {
		title += '.' + state.user;
		if (state.view == 'compare') { title += '.' + state.user2; }
	}
	return title;
}
function unpickleState(title) {
	if (title == '') {
		if (!games) { return {game: null, view: 'all'}; }
		var defaultGame = null;
		for (var i = 0; i < games.length; i++) {
			if (getTime() < games[i].stop) {
				defaultGame = games[i];
				break;
			}
		}
		if (!defaultGame) {
			defaultGame = games[games.length - 1];
		}
		return {game: defaultGame.id, view: 'all'};
	}
	var parts = title.split('.');
	state = {view: 'all'};
	if (parts[0]) {
		var demoParts = parts[0].split('-');
		if (demoParts[1] == 'demo') {
			state.game = demoParts[0];
			state.mode = 'demo';
			state.guestId = demoParts[2];
		}
		else {
			state.game = parts[0];
		}
	}
	else {
		state.game = games[0].id;
	}
	if (parts[1] == 'autoreload') { // for unpickling only
		state.autoreload = true;
		return state;
	}
	if (parts.length > 1) {
		state.view = 'user';
		state.user = parts[1];
		if (parts.length > 2) {
			state.view = 'compare';
			state.user2 = parts[2];
		}
	}
	return state;
}

function getHistoryTitle() {
	var parts = History.getState().url.split('?');
	var title = (parts.length > 1 ? parts[1] : '');
	if (title == '' && window.location.search.length > 1) {
		title = window.location.search.substr(1);
	}
	return title;
}

function switchToState(state, forceReload) {
	var title = pickleState(state);
	console.log("switchToState " + title);
	if (title != getHistoryTitle()) {
		History.pushState(null, '', '?' + title);
	}
	else if (forceReload) {
		loadState();
	}
}


function makeLinkHandler(state) {
	return function(e) {
		e.preventDefault();
		switchToState(state);
	};
}
function mapHandler(e) {
	e.preventDefault();
	var mapSelect = $(this).closest('.mapSelect');
	if (mapSelect.hasClass('selected')) {
		return;
	}
	$('.mapSelect.selected').removeClass('selected');
	mapSelect.addClass('selected');

	var $body = $('body');
   $body.removeClass('streets landsea blankcanvas beatenpaths hoods');
	$body.addClass(mapSelect.attr('id'));
}

////////////////////////////////////////////////////////////////////////////////
// loading functions

function loadState() {
	if (!initPromise.isResolved()) { return; }
	var state = unpickleState(getHistoryTitle());
	console.log("loadState");
	$('.selectedLink').removeClass('selectedLink');
	$('.sidebar-content').addClass('hidden');
	$('.portrait').removeClass('selected');
	currentUser = null;
	if (state.autoreload) {
		setTimeout(function() {
			window.location = 'main.html?' + getHistoryTitle();
		}, 60000);
	}
	if (!activeGame || state.game != activeGame.id) {
		activeGame = gamesById[state.game];
		loadGame(activeGame);
		loadUsers();
	}
	if (state.view == 'all') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		$('#individual-leaderboard').removeClass('hidden');
		$('#team-leaderboard').removeClass('hidden');
		if (!activeGame || activeGame.state != 'before') {
			$('.portrait').addClass('selected');
		}
		rideCanvas.clear();
		rideCanvas.update({'users': activeUsers});
		$('.pop-nav').hide();
	}
	else if (state.view == 'user') {
		if (state.user == authUserId) {
			$('.youLink').closest('li').addClass('selectedLink');
		}
		currentUser = usersById[state.user];
		showProfile(currentUser);
	}
	else if (state.view == 'compare') {
		rideCanvas.clear();
		var user1 = usersById[state.user];
		var user2 = usersById[state.user2];

		$('#stats-versus').removeClass('hidden');
		$('#stats-name1').text(user1.firstName);
		$('#stats-name2').text(user2.firstName);
		user1.portrait.addClass('selected');
		user2.portrait.addClass('selected');
		showUserStats(user1, $('#stats-user1'));
		showUserStats(user2, $('#stats-user2'));

		rideCanvas.update({'users': [user1, user2]});
		$('.pop-nav').hide();
	}
}

function loadGame(game) {
	console.log("loadGame " + game.name);
	activeUsers = users;
	if (game) {
		activeUsers = [];
		for (var i = 0; i < users.length; i++) {
			if (isUserInGame(users[i], game)) { activeUsers.push(users[i]); }
		}
	}

	$('#portrait-template').siblings().remove();
	$('#sidebar').hide();
	if (game) {
		if (!game.days) {
			initGame(game);
		}
		aggregateGameTrackData(game);

		setGamesMenu(game, function(g) { return function() { switchToState({game: g}); }; });

		$('.game-duration').text(game.humanDuration);
		if (game.players[0].team) {
			$('#team-leaderboard').show();
			$('#individual-leaderboard').hide();
		}
		else {
			$('#team-leaderboard').hide();
			$('#individual-leaderboard').show();
		}
		$('.col0').text("Week 1");
		$('.col1').text("Week 2");

		rideCanvas.setOptions({minTime: game.week1, maxTime: game.week3});
		$('#lastweek').addClass('selected');
		$('#thisweek').addClass('selected');

		if (game.state == 'before') {
			$('#portrait-control-nav').hide();
			$('#before-game').show();
			$('.before-game').text(game.name);
			$('#time-nav li').hide();
			rideCanvas.clear();
			var updateCountdown = function() {
				var dhms = getDHMS(game.start - getTime());
				$('.before-days').text(humanUnits(dhms[0], "day", true));
				$('.before-time').text(humanUnits(dhms[1], "hour", true) + " " + dhms[2] + " min " + dhms[3] + " sec");
				beforeGameTimeout = setTimeout(updateCountdown, 1000);
			};
			updateCountdown();
		}
		else {
			$('#portrait-control-nav').show();
			$('#before-game').hide();
			$('#time-nav li').show();
			if (beforeGameTimeout) {
				clearTimeout(beforeGameTimeout);
				beforeGameTimeout = null;
			}
			$('#sidebar').show();
		}
	}
}

function loadUsers() {
	console.log("loadUsers");
	var template = $('#portrait-template');
	activeUsers.sort(function(a, b) { return b.lastTrackEnd - a.lastTrackEnd; });
	for (var i = 0; i < activeUsers.length; i++) {
		var user = activeUsers[i];
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		if (activeGame && activeGame.state == 'before') {
			instance.addClass('disabled');
		}
		var color = '#' + (user.color || '2dddd2');
		instance.data('userId', user.id);
		instance.find('.avatarLink').click(onClickPortrait);
		instance.find('.compare a').click(onClickCompare);
		instance.find('.profileLink').click(onClickPortrait);
		instance.find('.avatar').attr('src', user.avatarSrc).css({borderColor: color});
		instance.find('.pop').css({backgroundColor: color});
		instance.find('.name').text(user.name);
		instance.find('.last-ride').text(user.lastTrackEnd ? "biked " + humanizeAgo(getTime() - user.lastTrackEnd)
		                                                   : "has not biked yet");
		template.parent().append(instance);
		user.portrait = instance;
	}

	if (activeGame) {
		activeUsers.sort(function(a, b) { return b.totalSmiles - a.totalSmiles; });
	}
	else {
		activeUsers.sort(function(a, b) { return (b.lastWeekDist + b.thisWeekDist) - (a.lastWeekDist + a.thisWeekDist); });
	}
	if (activeGame && activeGame.players[0].team) {
		$template = $('#team-leaderboard-template');
		$userTemplate = $('#team-leaderboard-user-template');
		for (var i = 0; i < activeGame.players.length; i++) {
			usersById[activeGame.players[i].userid].team = activeGame.players[i].team;
		}
		teamElements = [];
		for (var i = 0; i < activeUsers.length; i++) {
			var user = activeUsers[i];
			var $team = null;
			var teamName = user.team || '';
			for (var j = 0; j < teamElements.length; j++) {
				if (teamElements[j].data('team-name') == teamName) { $team = teamElements[j]; break; }
			}
			if (!$team) {
				$team = $template.clone().removeClass('template').attr('id', null).css({display: ''});
				$team.data('team-name', teamName);
				$team.data('total-smiles', 0);
				$team.find('.team-name').text(teamName);
				$team.find('.team-icon').attr('src', 'img/icon/' + teamName.replace(/ /g, '').toLowerCase()  + '.png');
				teamElements.push($team);
			}
			$user = $userTemplate.clone().removeClass('template').attr('id', null).css({display: ''});
			$user.css({borderLeft: "8px solid #" + user.color});
			$user.find('.stats-name').text(user.name.split(' ')[0]);
			$user.find('.stats-total-miles').text(Math.round(user.totalSmiles/M_PER_MI));
			$user.find('.rode-last').text(user.portrait.find('.last-ride').text());
			$team.append($user);
			$team.data('total-smiles', Number($team.data('total-smiles')) + user.totalSmiles);
		}
		teamElements.sort(function(a, b) { return Number(b.data('total-smiles')) - Number(a.data('total-smiles')); });
		$('#team-leaderboard .team:not(.template)').remove();
		for (var i = 0; i < teamElements.length; i++) {
			$('#team-leaderboard').append(teamElements[i]);
			teamElements[i].find('.team-smiles').text(Math.round(teamElements[i].data('total-smiles')/M_PER_MI));
		}
	}
	else {
		template = $('#leaderboard-template');
		for (var i = 0; i < activeUsers.length; i++) {
			var user = activeUsers[i];
			var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
			instance.find('.avatar').attr('src', user.avatarSrc);
			instance.find('.stats-name').text(user.name);
			instance.find('th').css({borderBottomColor: '#' + user.color});
			instance.find('td').css({borderTopColor: '#' + user.color});

			showUserSmiles(user, instance);
			template.parent().append(instance);
		}
	}
}



function showProfile(user) {
	$('#stats-profile').removeClass('hidden');
	$('#stats-name').text(user.name);
	user.portrait.addClass('selected');
	showUserStats(user, $('#stats-profile'));
	rideCanvas.clear();
	var popNavDivs = $('.pop-nav');
	popNavDivs.show();
	for (var i = 0; i < popNavDivs.length; i++) {
		if (popNavDivs.eq(i).closest('.portrait').data('userId') == user.id) {
			popNavDivs.eq(i).hide();
		}
	}
	rideCanvas.update({'users': [user]});
}

function showUserStats(user, $col) {
	$col.find('.stats-avatar').attr('src', user.avatarSrc);
	$col.find('.stats-color').css({backgroundColor: '#' + user.color});
	/*$col.find('.stats-color').css({borderBottomColor: '#' + user.color});*/

	var rides = 0;
	for (var i = 0; i < user.tracks.length; i++) {
		if (activeGame.week1 <= user.tracks[i].time && user.tracks[i].time < activeGame.week3) {
			rides += 1;
		}
	}
	rides = humanUnits(rides, 'ride');
	var fortnightDuration = user.durationByWeek[0] + user.durationByWeek[1];
	var hours = humanUnits(Math.floor(fortnightDuration / 3600), 'hour');
	var minutes = humanUnits(Math.floor(fortnightDuration % 3600 / 60), 'minute');
	var dur = hours + (hours && minutes ? ' and ' : '') + minutes;

	$col.find('.stats-duration').text('Spent ' + dur + ' on two wheels (' + rides + ')');

	showUserWeek(user, $col);
	showUserSmiles(user, $col);
}
function showUserWeek(user, $col) {
	var html = '';
	for (var i = 0; i < activeGame.days.length; i++) {
		var gameDay = activeGame.days[i];
		var userGameDay = user.gameDays[i];
		var beginCls = '';
		if (i % 7 == 0) {
			//html += '<tr>';
			beginCls = ' begin-week-' + ['one','two','three'][Math.floor(i/7)]; //TODO?
		}
		var bikedCls = (userGameDay.distance ? 'biked' : (gameDay.stop < getTime() ? 'rest' : ''));
		var ssCls = (userGameDay.ss ? 'super-spoked' : '');
		html += '<td class="user-color user-bgcolor ' + [bikedCls, ssCls, beginCls].join(' ') + '">' + gameDay.day;
		if (userGameDay.distance) {
			html += '<div class="pop-day user-bgcolor">' + humanUnits(Math.round(userGameDay.distance / M_PER_MI), 'smile', true);
			if (userGameDay.ss) { html += ' x2 Super-Spoked!'; }
			html += '</div>';
		}
		html += '</td>';
		if (i % 7 == 6 || i == activeGame.days.length - 1) { /*html += '</tr>';*/ }
	}
	if ($col) {
		$tr = $col.find('.week-chart-row');
		$tr.empty().html(html);
		$tr.find('.biked.user-color').css({color: '#' + user.color});
		$tr.find('.biked.super-spoked.user-bgcolor').css({color: '#fff', backgroundColor: '#' + user.color});
		$tr.find('.biked.super-spoked .pop-day.user-bgcolor').css({backgroundColor: '#' + user.color});
	}
}
function showUserSmiles(user, $col) {
	if (activeGame) {
		$col.find('.stats-col0').text(Math.round(user.smilesByWeek[0] / M_PER_MI));
		$col.find('.stats-col1').text(Math.round(user.smilesByWeek[1] / M_PER_MI));
	}
	else {
		$col.find('.stats-col0').text(Math.round(user.lastWeekSmiles / M_PER_MI));
		$col.find('.stats-col1').text(Math.round(user.thisWeekSmiles / M_PER_MI));
	}
	$col.find('.stats-total-miles').text(Math.round(user.totalSmiles / M_PER_MI));
	$col.find('.convert-total-miles').text(humanUnits(Math.round(user.totalDist / M_PER_MI), 'mile'));
}


function onClickPortrait(e) {
	e.preventDefault();
	if (activeGame && activeGame.state == 'before') { return; }
	var portrait = $(this).closest('.portrait');
	switchToState({view: 'user', 'user': portrait.data('userId')});
}
function onClickCompare(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	switchToState({view: 'compare', user: currentUser.id, user2: portrait.data('userId')});
}

$(function() {
	console.log("DOM ready");
	$('.template').css({display: 'none'});
	$body = $('body');
	console.log($body.scrollLeft() + " " + $body.scrollTop());
	if ($body.scrollLeft() == 0 && $body.scrollTop() == 0) {
		setTimeout(function() {
			$body.scrollLeft(DEFAULT_SCROLL_LEFT);
			$body.scrollTop(DEFAULT_SCROLL_TOP);
		}, 0);
	}

	if (demoMode) { $('#game-nav .games').hide(); }

	$('.your-profile').click(makeLinkHandler({view: 'user'}));
	$('.game-archive').click(function() { window.location.href = 'game-archive.html'; });
	$('.logout').click(sessionLogout);

	$('.game-name').click(makeLinkHandler({view: 'all'}))
	$('.youLink').click(makeLinkHandler({view: 'user'}));

	$('.mapSelect').click(mapHandler).eq(0).click(); // streets is default map

	$("#sidebar-btn-stats").click(function(e) {
		e.preventDefault();
		$("#sidebar").toggleClass('hidden');
	});

	$('#animate').click(function(e) {
		e.preventDefault();
		var $a = $(this);
		$a.toggleClass('selected');
		rideCanvas.redraw();
	});
	$('#lastweek').click(function(e) {
		e.preventDefault();
		var $a = $(this);
		$a.toggleClass('selected');
		if (activeGame) {
			rideCanvas.update({minTime: activeGame['week' + ($a.hasClass('selected') ? 1:2)]});
		}
		else {
			rideCanvas.update({minTime: lastWeek + $a.hasClass('selected')*7*86400});
		}
	});
	$('#thisweek').click(function(e) {
		e.preventDefault();
		var $a = $(this);
		$a.toggleClass('selected');
		if (activeGame) {
			rideCanvas.update({maxTime: activeGame['week' + ($a.hasClass('selected') ? 3:2)]});
		}
		else {
			rideCanvas.update({maxTime: ($a.hasClass('selected') ? getTime() : thisWeek)});
		}
	});
	initPromise.done(initMain);
});
function initMain() {
	console.log("initMain");
	History.Adapter.bind(window, 'statechange', loadState);
	loadState();
}
