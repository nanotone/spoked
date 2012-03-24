import json
import time

import bottle
import bson
import pymongo

db = pymongo.Connection().spoked

def crossorigin():
	if bottle.request.headers.get('Origin') == 'http://localhost':
		bottle.response.set_header('Access-Control-Allow-Origin', 'http://localhost')

def mimetype_json():
	bottle.response.set_header('Content-Type', 'application/json')

class JSONEncoder(json.JSONEncoder):
	def default(self, o):
		if isinstance(o, bson.objectid.ObjectId):
			return str(o)
		return json.JSONEncoder.default(self, o)
json_encoder = JSONEncoder()


@bottle.route('/auth')
def auth():
	crossorigin()
	mimetype_json()
	query = bottle.request.query
	auth_key = query.username.lower()
	try:
		spec = {'_id': bson.objectid.ObjectId(auth_key)}
	except:
		spec = {('email' if '@' in auth_key else 'twitterid'): auth_key, 'passwd': query.password}
	print spec
	user = db.users.find_one(spec)
	if user:
		return '{"auth":"%s"}' % (user['_id'])
	return '{"auth":""}'


@bottle.route('/')
def index():
	bottle.redirect('/static/main.html')
	return ('<div><a href="/static/everything.tar.gz">ALL THE CSVs!</a></div>'
		+ ''.join('<div>%s - %s [<a href="/static/csv/%s.csv">csv</a>] [<a href="/track/%s">json</a>]</div>'
		          % (' '.join(f['sender']), time.ctime(f['time']), f['_id'], f['_id'])
		          for f in db.tracks.find())
	)

@bottle.route('/tracks')
def tracks():
	crossorigin()
	mimetype_json()
	yield u'{' # first yield must be bytes or unicode, not str
	for (i, t) in enumerate(bottle.request.query.ids.split(',')):
		if i: yield ','
		yield '"%s":' % t
		yield open('static/json-sparse/%s.json' % t).read()
	yield '}'

@bottle.route('/info')
def info():
	crossorigin()
	mimetype_json()
	def gameobj(g):
		obj = {'id': g['_id']}
		for field in ('name', 'start', 'stop'):
			obj[field] = g.get(field)
		return obj
	def userobj(u):
		obj = {'id': u['_id']}
		for field in ('name', 'color', 'email', 'twitterid', 'passwd', 'duration', 'gameid'):
			obj[field] = u.get(field)
		return obj
	return json_encoder.encode({
		'games': list(gameobj(g) for g in db.games.find()),
		'tracks': list({'id': t['_id'], 'time': t['start_time'], 'userid': t['userid'], 'distance': t['distance'], 'duration': t['duration']} for t in db.tracks.find({'start_time': {'$gt': time.time() - 86400*14}})),
		'users': list(userobj(u) for u in db.users.find())
	})

@bottle.post('/saveUser')
def saveUser():
	crossorigin()
	mimetype_json()
	forms = bottle.request.forms
	print dict(forms)
	user = getattr(forms, 'id', None)
	if user and len(user) == 24:
		user = db.users.find_one({'_id': bson.objectid.ObjectId(user)})
	if not user:
		user = {}
	for field in ('name', 'color', 'email', 'twitterid'):
		user[field] = getattr(forms, field, '')
	if getattr(forms, 'passwd'):
		user['passwd'] = forms['passwd']
	user['email'] = user['email'].lower()
	user['twitterid'] = user['twitterid'].lower()
	db.users.save(user)
	return '{}'

bottle.run(host='0.0.0.0', port=8081)
