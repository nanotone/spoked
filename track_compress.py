import json
import sys

import geo

def can_drop(p0, p1, p2):
	if p2[2] - p0[2] > 15: return False
	if geo.dist_meters(p0, p2, geo.NEW_YORK) > 25: return False
	if geo.dist_meters(p0, p1, geo.NEW_YORK) < 10 or \
	   geo.dist_meters(p1, p2, geo.NEW_YORK) < 10: return True
	if geo.angle(p0, p1, p2, geo.NEW_YORK) > 15: return False
	return True
	
def compress_track(data):
	p0 = p1 = None
	for p in data:
		if p0 and p1:
			if can_drop(p0, p1, p):
				p1 = p
				continue
			yield p0
		(p0, p1) = (p1, p)
	yield p0
	yield p1

def compress_track_file(track):
	with open('static/json/%s.json' % track) as f:
		data = json.load(f)
	length = len(data)
	data = list(compress_track(data))
	print "Dropped", float(length - len(data)) / length, "of points"
	with open('static/json-sparse/%s.json' % track, 'w') as f:
		json.dump(data, f)

if __name__ == '__main__':
	compress_track_file(sys.argv[1])

