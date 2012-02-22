import time
from xml.dom import minidom

def gen_gpx_points(src):
	gpx = minidom.parse(src).documentElement
	for trk in gpx.getElementsByTagName('trk'):
		for trkseg in trk.getElementsByTagName('trkseg'):
			for trkpt in trkseg.getElementsByTagName('trkpt'):
				lat = float(trkpt.getAttribute('lat'))
				lon = float(trkpt.getAttribute('lon'))
				try:
					ele = float(trkpt.getElementsByTagName('ele')[0].firstChild.nodeValue)
				except:
					ele = '0'
				try:
					date = tstamp = ''
					date = trkpt.getElementsByTagName('time')[0].firstChild.nodeValue
					tstamp = time.mktime(time.strptime(date, '%Y-%m-%dT%H:%M:%SZ'))
				except:
					pass
				yield (lat, lon, ele, date, tstamp)

def gpx_to_json(src, dst):
	with open(dst, 'w') as f:
		f.write('[')
		f.write(','.join('[%s,%s,%d]' % (p[0], p[1], p[4]) for p in gen_gpx_points(src)))
		f.write(']')

def gpx_to_csv(src, dst):
	with open(dst, 'w') as f:
		for point in gen_gpx_points(src):
			f.write('%s,%s,%s,%s,%d\n' % point)

if __name__ == '__main__':
	import sys
	assert len(sys.argv) in (1, 2, 3)
	if len(sys.argv) == 3:
		func = globals()['gpx_to_' + sys.argv[2].split('.')[-1]]
		func(sys.argv[1], sys.argv[2])
	else:
		import pymongo
		from pymongo.objectid import ObjectId
		db = pymongo.Connection().spoked
		spec = None
		if len(sys.argv) == 2:
			assert len(sys.argv[1]) == 24, "first arg must be an ObjectId"
			spec = {'_id': ObjectId(sys.argv[1])}
		for t in db.tracks.find(spec):
			gpxpath = 'static/gpx/%s.gpx' % t['_id']
			gpx_to_csv (gpxpath, 'static/csv/%s.csv'   % t['_id'])
			gpx_to_json(gpxpath, 'static/json/%s.json' % t['_id'])
