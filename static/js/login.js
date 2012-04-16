function gotoMain(authData) {
	var endpoint = 'main.html';
	if (authData.gameid) {
		endpoint += '?' + authData.gameid;
	}
	else if (authData.archive) {
		endpoint = 'game-archive.html';
	}
	window.location.replace(endpoint);
}
$(function() {
	var auth = $.cookie('spokedAuth');
	if (auth) {
		$.getJSON(SERVER + 'auth', {'username': auth}, function(data) {
			if (data.auth) {
				gotoMain(data);
			}
			else {
				$.cookie('spokedAuth', '');
			}
		});
	}
	$('#form').submit(function(e) {
		e.preventDefault();
		$.post(AUTH_SERVER + 'auth', $('#form').serialize(), function(data) {
			if (data.auth) {
				$.cookie('spokedAuth', data.auth);
				gotoMain(data);
			}
			else {
				$('.wrong').show();
			}
		}, 'json');
	});
});
