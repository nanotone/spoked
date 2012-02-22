import time

import bottle
import pymongo

db = pymongo.Connection().spoked

@bottle.route('/')
def index():
	return ('<div><a href="/static/everything.tar.gz">everything!</div>'
		+ ''.join('<div><a href="/static/csv/%s.csv">%s - %s</a></div>' % (f['_id'], ' '.join(f['sender']), time.ctime(f['time'])) for f in db.tracks.find())
	)

@bottle.route('/track/<oid>')
def track(oid):
	if bottle.request.headers.get('Origin') == 'http://localhost':
		bottle.response.set_header('Access-Control-Allow-Origin', 'http://localhost')
	return bottle.static_file('%s.json' % oid, root='static/json', mimetype='text/plain')

bottle.run(host='0.0.0.0', port=8081)
