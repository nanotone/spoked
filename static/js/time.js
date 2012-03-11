(function() {
	var day = 24 * 3600;
	var d = new Date();
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	var midnight = Math.floor(d.getTime() / 1000);
	window.thisWeek = midnight - ((d.getDay() + 6) % 7) * day;
	window.lastWeek = thisWeek - 7 * day;
})();

function getTime() {
	return (new Date().getTime()) / 1000;
}
