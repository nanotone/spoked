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

var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatLocaleString(d) {
	var basicDateStr = days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate();
	var hours = d.getHours();
	var basicTimeStr = ((hours+11)%12+1) + ':' + String(100+d.getMinutes()).substr(1) + ' ' + (hours < 12 ? 'am':'pm');
	var localeString = d.toLocaleString();
	if (localeString[34] == '(' && localeString[38] == ')') {
		basicTimeStr += ' ' + localeString.substr(35, 3);
	}
	return basicDateStr + ' ' + basicTimeStr;
}
