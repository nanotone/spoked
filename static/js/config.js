var SERVER = 'http://iamspoked.com/';
var AUTH_SERVER = 'https://iamspoked.com/';
if (window.location.host != 'iamspoked.com') {
	SERVER = AUTH_SERVER = 'http://dev.iamspoked.com/';
}
