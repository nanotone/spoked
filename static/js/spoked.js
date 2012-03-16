var instance = null;
var infoPromise = $.Deferred();
var pdePromise = $.Deferred();
var initPromise = $.when(infoPromise, pdePromise, sessionPromise);

var currentUser = null;

function processingReady() {
	instance = Processing.getInstanceById('processing');
	pdePromise.resolve();
}
function processingUpdatedTime(tstamp) {
	$('#animation-clock').show().text(formatLocaleString(new Date(tstamp*1000)));
}
function processingFinishedAnimating() {
	$('#animation-clock').hide();
	$('#animate').removeClass('selected');
}

function showPortraits() {
	var template = $('#portrait-template');
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		var color = '#' + (user.color || '2dddd2');
		instance.data('userId', user.id);
		instance.find('.avatarLink').click(onClickPortrait);
		instance.find('.compare a').click(onClickCompare);
		instance.find('.profileLink').click(onClickPortrait);
		instance.find('.avatar').attr('src', user.avatarSrc).css({borderColor: color});
		instance.find('.pop').css({backgroundColor: color});
		instance.find('.name').text(user.name);
		template.parent().append(instance);
	}
	template = $('#leaderboard-template');
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		var instance = template.clone().removeClass('template').attr('id', null).css({display: ''});
		instance.find('.avatar').attr('src', user.avatarSrc);
		instance.find('.stats-name').text(user.name);
		instance.find('th').css({borderBottomColor: '#' + user.color});
		instance.find('td').css({borderTopColor: '#' + user.color});

		showUserMiles(user, instance);
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
	currentUser = null;
	if (title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		$('#leaderboard').removeClass('hidden');
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		rideCanvas.update({'users': users});
		$('.pop-nav').hide();
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
		currentUser = usersById[authUserId];
		showProfile(currentUser);
	}
	else if (title.length == 24) {
		currentUser = usersById[title];
		showProfile(currentUser);
	}
	else if (title.length == 49) {
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		var user1 = usersById[title.substr(0, 24)];
		var user2 = usersById[title.substr(25)];

		$('#stats-versus').removeClass('hidden');
		$('#stats-name1').text(user1.name);
		$('#stats-name2').text(user2.name);
		showUserStats(user1, $('#stats-user1'));
		showUserStats(user2, $('#stats-user2'));

		rideCanvas.update({'users': [user1, user2]});
		$('.pop-nav').hide();
	}
}

function showProfile(user) {
	$('#stats-profile').removeClass('hidden');
	$('#stats-name').text(user.name);
	showUserStats(user, $('#stats-profile'));
	instance.abortRideAnimations();
	instance.background('#ffffff', 0);
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
	showUserMiles(user, $col);

	var rides = 0;
	for (var i = 0; i < user.tracks.length; i++) {
		if (user.tracks[i].time >= lastWeek) {
			rides += 1;
		}
	}
	rides = rides + ' ride' + (rides == 1 ? '':'s') + ', ';
	var hours = Math.floor(user.fortnightDuration / 3600);
	var minutes = Math.floor(user.fortnightDuration % 3600 / 60);
	var dur = (hours ? hours+' hr ' : '') + (minutes ? minutes+' min' : '') + ' on bike seat';
	$col.find('.stats-duration').text(rides + dur)
}
function showUserMiles(user, $col) {
	var lastWeekDist = user.lastWeekDist / 1609.344;
	var thisWeekDist = user.thisWeekDist / 1609.344;
	$col.find('.stats-last-week').text(Math.round(lastWeekDist));
	$col.find('.stats-this-week').text(Math.round(thisWeekDist));
	$col.find('.stats-total-miles').text(Math.round(lastWeekDist + thisWeekDist));
}


function onClickPortrait(e) {
	e.preventDefault();
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
	$('.template').css({display: 'none'});
	$('.auth').hide();

	$('.toggle-login-form').click(function() {
		$('#login-form').toggle();
		$('#login-form .username').focus();
	});
	$('#login-form').submit(sessionLogin);
	$('.your-profile').click(makeLinkHandler('you'));
	$('.logout').click(sessionLogout);

	$('.friendsLink').click(makeLinkHandler('friends'));
	$('.youLink').click(makeLinkHandler('you'));

	$('.mapSelect a').click(mapHandler);
	$('#streets a').eq(0).click(); // select streets as the default map

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

	initData();
	initSession();
	initPromise.done(initMain);
});
function initMain() {
	History.Adapter.bind(window, 'statechange', loadState);
	showPortraits();
	loadState();
}

