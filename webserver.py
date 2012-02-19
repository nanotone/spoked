import time

import bottle
import pymongo

db = pymongo.Connection().spoked

@bottle.route('/')
def index():
	return ('<div><a href="/static/everything.tar">everything!</div>'
		+ ''.join('<div><a href="/static/csv/%s.csv">%s - %s</a></div>' % (f['_id'], ' '.join(f['sender']), time.ctime(f['time'])) for f in db.tracks.find())
	)

bottle.run(host='0.0.0.0', port=8081)
