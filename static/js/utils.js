var M_PER_MI = 1609.344;

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function darken(color) {
	var intColor = 0;
	for (var i = 0; i < 3; i++) {
		intColor += Math.round(parseInt(color.substr(2*i, 2), 16) * 0.8) * Math.pow(256, 2 - i);
	}
	return intColor.toString(16);
}

function lighten(color) {
	var intColor = 0;
	for (var i = 0; i < 3; i++) {
		intColor += Math.round((255 - parseInt(color.substr(2*i, 2), 16)) * 0.8) * Math.pow(256, 2 - i);
	}
	return (0xffffff - intColor).toString(16);
}

function ordinal(n) { return n + ["st", "nd", "rd", "th"][Math.min((n + 9) % 10, 3)]; }

function formatDay(d) {
	return (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()] + " " +
		MONTHS[d.getMonth()] + " " + ordinal(d.getDate())
	);
}

function formatDuration(startTime, stopTime) {
	var startDate = new Date(startTime * 1000);
	var stopDate = new Date(stopTime * 1000);
	var startFmt = formatDay(startDate);
	if (startDate.getYear() != stopDate.getYear()) {
		startFmt += " " + startDate.getFullYear();
	}
	return startFmt + " - " + formatDay(stopDate) + " " + stopDate.getFullYear();
}

function humanUnits(num, unit, explicitZero) {
	if (num == 0 && !explicitZero) { return ''; }
	return num + ' ' + unit + (num == 1 ? '' : 's');
}

function humanizeAgo(seconds) {
	var data = [[1, "second"], [60, "minute"], [3600, "hour"], [86400, "day"], [604800, "week"], [2629728, "month"], [31556736, "year"]];
	while (data.length > 1 && seconds >= data[1][0]) { data.shift(); }
	var num = Math.floor(seconds / data[0][0] + 0.25);
	return humanUnits(num, data[0][1]) + " ago";
}


