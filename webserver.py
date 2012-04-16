import json
import time

import bottle
import bson
import pymongo

db = pymongo.Connection().spoked

################################################################################
# json stuff

def crossorigin():
	origin = bottle.request.headers.get('Origin')
	if origin in ('http://localhost', 'http://iamspoked.com', 'https://iamspoked.com'):
		bottle.response.set_header('Access-Control-Allow-Origin', origin)

def mimetype_json():
	bottle.response.set_header('Content-Type', 'application/json')

class JSONEncoder(json.JSONEncoder):
	def default(self, o):
		if isinstance(o, bson.objectid.ObjectId):
			return str(o)
		return json.JSONEncoder.default(self, o)
json_encoder = JSONEncoder()

def gameobj(g):
	obj = {'id': g['_id']}
	for field in ('name', 'start', 'stop', 'players'):
		obj[field] = g.get(field)
	return obj
def userobj(u):
	obj = {'id': u['_id']}
	for field in ('name', 'color', 'duration'):
		obj[field] = u.get(field)
	return obj
def trackobj(t):
	obj = {'id': t['_id']}
	for field in ('userid', 'distance', 'duration'):
		obj[field] = t.get(field)
	obj['time'] = t.get('start_time')
	return obj

################################################################################

@bottle.post('/emailbox')
def emailbox():
	crossorigin()
	forms = bottle.request.forms
	doc = {}
	for field in ('email', 'disposition', 'notes'):
		doc[field] = getattr(forms, field, None)
	db.emailbox.insert(doc)
	return 'OK'

@bottle.route('/auth', method=['GET', 'POST'])
def auth():
	crossorigin()
	mimetype_json()
	query = bottle.request.query
	if bottle.request.method == 'POST':
		query = bottle.request.forms
	auth_key = query.username.lower()
	try:
		spec = {'_id': bson.objectid.ObjectId(auth_key)}
	except:
		spec = {('email' if '@' in auth_key else 'twitterid'): auth_key, 'passwd': query.password}
	print spec
	user = db.users.find_one(spec)
	if user:
		result = {'auth': user['_id']}
		for g in db.games.find({'stop': {'$gt': time.time()}}, sort=[('start', 1)]):
			if user['_id'] in (p['userid'] for p in g.get('players', ())):
				result['gameid'] = g['_id']
				break
			result['archive'] = True
		return json_encoder.encode(result)
	return '{"auth":""}'


@bottle.route('/')
def index():
	bottle.redirect('/static/main.html')

@bottle.route('/tracks', method=['GET', 'POST'])
def tracks():
	crossorigin()
	mimetype_json()
	query = bottle.request.query
	if bottle.request.method == 'POST':
		query = bottle.request.forms
	yield u'{' # first yield must be bytes or unicode, not str
	for (i, t) in enumerate(query.ids.split(',')):
		if i: yield ','
		yield '"%s":' % t
		yield open('data/json-sparse/%s.json' % t).read()
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

@bottle.route('/gameinfo')
def gameinfo():
	crossorigin()
	mimetype_json()
	userid = bottle.request.query.get('auth')
	if not userid: return "no userid"
	userid = bson.objectid.ObjectId(userid)
	games = []
	userids = set()
	for g in db.games.find():
		for player in g.get('players', ()):
			if player['userid'] == userid:
				games.append(g)
				userids |= set(p['userid'] for p in g['players'])
				break
	userids = list(userids)
	start_time = time.time() - 86400*14
	tracks = db.tracks.find({'userid': {'$in': userids}})
	return json_encoder.encode({
		'games': [gameobj(g) for g in games],
		'tracks': [trackobj(t) for t in tracks if t.get('canonical') in (None, t['_id'])],
		'users': [userobj(u) for u in db.users.find({'_id': {'$in': userids}})],
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
