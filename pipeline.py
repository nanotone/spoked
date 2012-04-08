import json

import bson

import geo
import parse_gpx
import track_compress

def pipeline(track, db):
	if not isinstance(track, dict):
		track = db.tracks.find_one({'_id': bson.objectid.ObjectId(track)})
		assert track is not None

	print "Processing track", track['_id']

	gpx_path = 'data/gpx/%s.gpx' % track['_id']
	json_path = 'data/json/%s.json' % track['_id']
	sparse_path = 'data/json-sparse/%s.json' % track['_id']

	parse_gpx.gpx_to_json(gpx_path, json_path)
	track_compress.compress_track_file(json_path, sparse_path)

	track_data = json.load(open(json_path))
	start_time = track_data[0][2]
	duration = track_data[-1][2] - start_time
	distance = sum(geo.dist_meters(track_data[i-1], track_data[i], geo.NEW_YORK) for i in xrange(1, len(track_data)))
	db.tracks.update({'_id': track['_id']}, {'$set': {'start_time': start_time, 'distance': distance, 'duration': duration}})

	return {'duration': duration} # return any/all data that could be useful for incremental updates

if __name__ == '__main__':
	import sys
	import pymongo
	db = pymongo.Connection().spoked
	if len(sys.argv) > 1:
		for track_id in sys.argv[1:]:
			pipeline(track_id, db)
	else:
		for track in db.tracks.find():
			pipeline(track, db)
