
var thisWeek, lastWeek;

var demoTime;
function newDate() {
	return (demoTime ? new Date(demoTime*1000) : new Date());
}

function setRealTime(t) {
	var day = 24 * 3600;
	demoTime = t;
	var d = newDate();
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	var midnight = Math.floor(d.getTime() / 1000);
	thisWeek = midnight - ((d.getDay() + 6) % 7) * day;
	lastWeek = thisWeek - 7 * day;
}
setRealTime();

function getTime() {
	return (newDate().getTime()) / 1000;
}

function getDHMS(seconds) {
	var d = new Date(seconds * 1000);
	return [d.getUTCDate() - 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()];
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
