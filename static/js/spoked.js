var M_PER_MI = 1609.344;
var DEFAULT_SCROLL_LEFT = 20;
var DEFAULT_SCROLL_TOP = 970;

var initPromise = $.when(initData(), initRender());

var currentUser = null;
var gameState = '';

function processingUpdatedTime(tstamp) {
	$('#animation-clock').show().text(formatLocaleString(new Date(tstamp*1000)));
}
function processingFinishedAnimating() {
	$('#animation-clock').hide();
	$('#animate').removeClass('selected');
}

function showPortraits() {
	console.log("showPortraits");
	var template = $('#portrait-template');
	users.sort(function(a, b) { return b.lastTrackEnd - a.lastTrackEnd; });
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		if (gameState && usersById[authUserId].game != user.game) {
			continue;
		}
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
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

	template = $('#leaderboard-template');
	if (userGame) {
		users.sort(function(a, b) { return b.totalSmiles - a.totalSmiles; });
	}
	else {
		users.sort(function(a, b) { return (b.lastWeekDist + b.thisWeekDist) - (a.lastWeekDist + a.thisWeekDist); });
	}
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		instance.find('.avatar').attr('src', user.avatarSrc);
		instance.find('.stats-name').text(user.name);
		instance.find('th').css({borderBottomColor: '#' + user.color});
		instance.find('td').css({borderTopColor: '#' + user.color});

		showUserSmiles(user, instance);
		template.parent().append(instance);
	}
}

function switchToTitle(title, reload) {
	if (title != getHistoryTitle()) {
		if (title == 'friends') {
			title = '';
		}
		History.pushState(null, '', '?' + title);
	}
	else if (reload) {
		loadState();
	}
}

function makeLinkHandler(title) {
	return function(e) {
		e.preventDefault();
		switchToTitle(title);
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


function getHistoryTitle() {
	var parts = History.getState().url.split('?');
	var title = (parts.length > 1 ? parts[1] : '');
	if (title == '' && window.location.search.length > 1) {
		title = window.location.search.substr(1);
	}
	if (title == '') {
		title = 'friends';
	}
	return title;
}

function loadState() {
	if (!initPromise.isResolved()) { return; }
	var title = getHistoryTitle();
	console.log("loadState " + title);
	$('.selectedLink').removeClass('selectedLink');
	$('.sidebar-content').addClass('hidden');
	$('.portrait').removeClass('selected');
	currentUser = null;
	if (title == 'autoreload') {
		setTimeout(function() {
			window.location = 'main.html?autoreload';
		}, 60000);
		title = 'friends';
	}
	if (title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		$('#leaderboard').removeClass('hidden');
		$('.portrait').addClass('selected');
		rideCanvas.clear();
		rideCanvas.update({'users': users});
		$('.pop-nav').hide();
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
		currentUser = usersById[authUserId];
		showProfile(currentUser);
	}
	else if (title.length == 24) {
		if (title == authUserId) {
			$('.youLink').closest('li').addClass('selectedLink');
		}
		currentUser = usersById[title];
		showProfile(currentUser);
	}
	else if (title.length == 49) {
		rideCanvas.clear();
		var user1 = usersById[title.substr(0, 24)];
		var user2 = usersById[title.substr(25)];

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
		if (user.tracks[i].time >= lastWeek) {
			rides += 1;
		}
	}
	rides = humanUnits(rides, 'ride');
	var hours = humanUnits(Math.floor(user.fortnightDuration / 3600), 'hour');
	var minutes = humanUnits(Math.floor(user.fortnightDuration % 3600 / 60), 'minute');
	var dur = hours + (hours && minutes ? ' and ' : '') + minutes;

	$col.find('.stats-duration').text('Spent ' + dur + ' on two wheels (' + rides + ')');

	showUserWeek(user, $col);
	showUserSmiles(user, $col);
}
function showUserWeek(user, $col) {
	var html = '';
	for (var i = 0; i < gameDays.length; i++) {
		var gameDay = gameDays[i];
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
		if (i % 7 == 6 || i == gameDays.length - 1) { /*html += '</tr>';*/ }
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
	$col.find('.stats-last-week').text(Math.round(user.lastWeekSmiles / M_PER_MI));
	$col.find('.stats-this-week').text(Math.round(user.thisWeekSmiles / M_PER_MI));
	$col.find('.stats-total-miles').text(Math.round(user.totalSmiles / M_PER_MI));
	$col.find('.convert-total-miles').text(humanUnits(Math.round(user.totalDist / M_PER_MI), 'mile'));
}


function onClickPortrait(e) {
	e.preventDefault();
	if (gameState && gameState != 'during') { return; }
	var portrait = $(this).closest('.portrait');
	var userId = portrait.data('userId');
	switchToTitle(userId);
}
function onClickCompare(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	switchToTitle(currentUser.id + '-' + portrait.data('userId'));
}

$(function() {
	console.log("DOM ready");
	$('.template').css({display: 'none'});
	//$('#sidebar').hide();
	$body = $('body');
	console.log($body.scrollLeft() + " " + $body.scrollTop());
	if ($body.scrollLeft() == 0 && $body.scrollTop() == 0) {
		setTimeout(function() {
			$body.scrollLeft(DEFAULT_SCROLL_LEFT);
			$body.scrollTop(DEFAULT_SCROLL_TOP);
		}, 0);
	}

	$('.your-profile').click(makeLinkHandler('you'));
	$('.logout').click(sessionLogout);

	$('.game-name').click(makeLinkHandler('friends'));
	$('.youLink').click(makeLinkHandler('you'));

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
		rideCanvas.update({minTime: ($a.hasClass('selected') ? lastWeek : thisWeek)});
	});
	$('#thisweek').click(function(e) {
		e.preventDefault();
		var $a = $(this);
		$a.toggleClass('selected');
		rideCanvas.update({maxTime: ($a.hasClass('selected') ? getTime() : thisWeek)});
	});
	initPromise.done(initMain);
});
function initMain() {
	console.log("initMain");
	showPortraits();
	if (gameState == 'before') {
		initBeforeGame();
	}
	else if (!gameState || gameState == 'during') {
		$('#sidebar').show();
		History.Adapter.bind(window, 'statechange', loadState);
		loadState();
	}
}

function initBeforeGame() {
	var game = usersById[authUserId].game;
	$('.pop').hide();
	$('#portrait-control-nav').hide();
	$('.portrait a').addClass('disabled');
	$('#before-game').show();
	$('.before-game').text(game.name);
	$('#time-nav li').hide();
	var updateCountdown = function() {
		var timeLeft = game.start - getTime();
		$('.before-days').text(humanUnits(Math.floor(timeLeft / 86400), "day", true));
		timeLeft %= 86400;
		$('.before-time').text(humanUnits(Math.floor(timeLeft/3600), "hour", true) + " " +
		                       Math.floor(timeLeft%3600/60) + " min " + Math.floor(timeLeft%60) + " sec");
		setTimeout(updateCountdown, 1000);
	};
	updateCountdown();
}

