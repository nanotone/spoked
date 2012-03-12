var instance = null;
var infoPromise = $.Deferred();
var pdePromise = $.Deferred();
var initPromise = $.when(infoPromise, pdePromise);

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
		instance.find('.avatar').attr('src', 'img/avatar/' + user.slug + '.jpg').css({borderColor: color});
		instance.find('.pop').css({backgroundColor: color});
		instance.find('.name').text(user.name);
		template.parent().append(instance);
	}
}

function makeLinkHandler(title) {
	return function(e) {
		e.preventDefault();
		if (title != History.getState().title) {
			History.pushState(null, '', '?' + title);
		}
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


function loadState() {
	if (!initPromise.isResolved()) { return; }
	var parts = History.getState().url.split('?');
	var title = (parts.length > 1 ? parts[1] : '');
	if (title == '' && window.location.search.length > 1) {
		title = window.location.search.substr(1);
	}
	console.log("loadState " + title);
	$('.selectedLink').removeClass('selectedLink');
	$('.sidebar-content').addClass('hidden');
	currentUser = null;
	if (title == '' || title == 'friends') {
		$('.friendsLink').closest('li').addClass('selectedLink');
		$('#leaderboard').removeClass('hidden');
		instance.abortRideAnimations();
		instance.background('#ffffff', 0);
		rideCanvas.update({'users': users});
		$('.pop-nav').hide();
	}
	else if (title == 'you') {
		$('.youLink').closest('li').addClass('selectedLink');
		currentUser = users[0];
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
	$col.find('.stats-avatar').attr('src', 'img/avatar/' + user.slug + '.jpg');
	var hours = Math.floor(user.duration / 3600);
	var minutes = Math.floor(user.duration % 3600 / 60);
	var dur = (hours ? hours+' hr ' : '') + (minutes ? minutes+' min' : '') + ' on bike seat';
	$col.find('.stats-duration').text(user.tracks.length + ' rides, ' + dur)
}


function onClickPortrait(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	var userId = portrait.data('userId');
	History.pushState(null, '', '?' + userId);
}
function onClickCompare(e) {
	e.preventDefault();
	var portrait = $(this).closest('.portrait');
	History.pushState(null, '', '?' + currentUser.id + '-' + portrait.data('userId'));
}

$(function() {
	initData();
	$('.template').css({display: 'none'});
	infoPromise.done(showPortraits);
	infoPromise.done(loadState);

	$('.friendsLink').click(makeLinkHandler('friends'));
	$('.youLink').click(makeLinkHandler('you'));

	$('.mapSelect a').click(mapHandler);
	$('#streets a').eq(0).click(); // select streets as the default map

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

	History.Adapter.bind(window, 'statechange', loadState);
	
	$("#sidebar-btn-stats").click(function(e) {
		e.preventDefault();
		$sidebar = $("#sidebar");
			
		if($sidebar.hasClass("hidden")) {
			$sidebar.removeClass("hidden");
		} else {
			$sidebar.addClass("hidden");
		}
	});
});

