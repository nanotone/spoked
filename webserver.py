import json
import time

import bottle
import pymongo

db = pymongo.Connection().spoked

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
	bottle.response.set_header('Content-Type', 'text/plain')
	return '[' + ','.join('"%s"' % t['_id'] for t in db.tracks.find()) + ']'

@bottle.route('/track/<oid>')
def track(oid):
	crossorigin()
	return bottle.static_file('%s.json' % oid, root='static/json', mimetype='text/plain')

@bottle.route('/users')
def users():
	crossorigin()
	bottle.response.set_header('Content-Type', 'text/plain')
	return '[' + ','.join('"%s"' % u['_id'] for u in db.users.find()) + ']'

@bottle.route('/info')
def info():
	crossorigin()
	bottle.response.set_header('Content-Type', 'text/plain')
	return json.dumps({
		'tracks': list({'id': str(t['_id']), 'time': t['time'], 'userid': str(t['userid'])} for t in db.tracks.find()),
		'users': list({'id': str(u['_id']), 'name': u['name']} for u in db.users.find())
	})

def crossorigin():
	if bottle.request.headers.get('Origin') == 'http://localhost':
		bottle.response.set_header('Access-Control-Allow-Origin', 'http://localhost')

bottle.run(host='0.0.0.0', port=8081)
