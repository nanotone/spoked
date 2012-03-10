import json
import pymongo

db = pymongo.Connection().spoked

for track in db.tracks.find():
	if track.get('start_time'): continue
	track['start_time'] = json.load(open('static/json/%s.json' % track['_id']))[0][2]
	db.tracks.save(track)
