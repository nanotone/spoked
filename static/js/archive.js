
var initPromise = $.when(initData());

function initMain() {
	console.log("initMain");

	setGamesMenu(null, function(g) { return function() {
		var pathparts = window.location.href.split('/');
		pathparts[pathparts.length - 1] = 'main.html?' + g.id;
		window.location.href = pathparts.join('/');
	}; });

	$template = $('#game-template');
	for (var i = 0; i < games.length; i++) {
		var game = games[i];
		if (game.stop > getTime()) { continue; }
		console.log(game.name);
		initGame(game);
		var activeUsers = [];
		for (var j = 0; j < users.length; j++) {
			if (isUserInGame(users[j], game)) { activeUsers.push(users[j]); }
		}
		aggregateGameTrackData(game);
		var totalSmiles = 0;
		for (var j = 0; j < activeUsers.length; j++) {
			totalSmiles += activeUsers[j].totalSmiles;
		}
		var $instance = $template.clone().removeClass('template').attr('id', null).css({display: ''});
		$instance.attr('href', 'main.html?' + game.id);
		$instance.find('.game-name').text(game.name);
		$instance.find('.game-smiles').text(humanUnits(Math.round(totalSmiles / M_PER_MI), "smile", true));
		$instance.find('.game-duration').text(game.humanDuration);
		if (game.players[0].team) {
			var teamsByName = {};
			var winnerTeam = null;
			for (var j = 0; j < game.players.length; j++) {
				var player = game.players[j];
				var teamName = player.team;
				if (!teamName) { continue; }
				var team = teamsByName[teamName];
				if (!team) {
					var $node = $('<div class="team"><h4 class="team-name"><mg src="img/icon/' + teamName.toLowerCase() + '.png" />' + teamName + '</h4><h4 class="team-smiles"></h4></div>');
					team = teamsByName[teamName] = {node: $node, smiles: 0};
					$instance.find('.game-text').append(team.node);
				}
				var user = usersById[player.userid];
				team.smiles += user.totalSmiles;
				team.node.find('.team-smiles').text(Math.round(team.smiles / M_PER_MI));
				if (!winnerTeam || team.smiles > winnerTeam.smiles) { winnerTeam = team; }
				team.node.append($('<img class="avatar" src="img/avatar/' + user.slug + '.jpg" />'));
			}
			winnerTeam.node.find('.team-smiles').addClass('team-winner');
		}
		else {
			var winner = null;
			for (var j = 0; j < activeUsers.length; j++) {
				if (!winner || activeUsers[j].totalSmiles > winner.totalSmiles) { winner = activeUsers[j]; }
			}
			var $team = $('<div class="individuals"></div>');
			for (var j = 0; j < activeUsers.length; j++) {
				var avatarHtml = '<img class="avatar" src="img/avatar/' + activeUsers[j].slug + '.jpg" />';
				if (activeUsers[j] == winner) {
					$team.append($('<div class="individual-winner">' + avatarHtml + '</div>'));
				}
				else {
					$team.append($(avatarHtml));
				}
			}
			$instance.find('.game-text').append($team);
		}
		$instance.insertAfter($('.game-root').last());
	}
}

$(function() {
	$('.template').css({display: 'none'});

	$('.logout').click(sessionLogout);

	initPromise.done(initMain);
});
