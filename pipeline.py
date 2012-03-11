import json

import bson

import parse_gpx
import track_compress

def pipeline(track, db):
	if not isinstance(track, dict):
		track = db.find_one({'_id': bson.objectid.ObjectId(track)})
		assert track is not None

	gpx_path = 'static/gpx/%s.gpx' % track['_id']
	#csv_path = 'static/csv/%s.csv' % track['_id']
	json_path = 'static/json/%s.json' % track['_id']
	sparse_path = 'static/json-sparse/%s.json' % track['_id']

	#parse_gpx.gpx_to_csv(gpx_path, csv_path)
	parse_gpx.gpx_to_json(gpx_path, json_path)
	track_compress.compress_track_file(json_path, sparse_path)

	start_time = json.load(open(json_path))[0][2]
	db.tracks.update({'_id': track['_id']}, {'$set': {'start_time': start_time}})

if __name__ == '__main__':
	import pymongo
	db = pymongo.Connection().spoked
	for track in db.tracks.find():
		pipeline(track, db)
