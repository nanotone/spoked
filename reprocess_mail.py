import pymongo

import pipeline
import user

db = pymongo.Connection().spoked
user.db = db

for track in db.tracks.find({'userid': None}):
	userid = user.userid_from_sender(track['sender'])
	if userid:
		track['userid'] = userid
		track_result = pipeline.pipeline(track['_id'], db)
		print track_result
		db.users.update({'_id': userid}, {'$inc': {'total_duration': track_result['duration']}})
		db.tracks.save(track)
		print track['sender'], userid
