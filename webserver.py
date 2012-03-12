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


@bottle.route('/')
def index():
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
	return json_encoder.encode({
		'tracks': list({'id': t['_id'], 'time': t['start_time'], 'userid': t['userid']} for t in db.tracks.find()),
		'users': list({'id': u['_id'], 'name': u['name'], 'color': u['color'], 'total_duration': u['total_duration']} for u in db.users.find())
	})

bottle.run(host='0.0.0.0', port=8081)
