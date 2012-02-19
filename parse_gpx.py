import time
from xml.dom import minidom

def gpx_to_csv(src, dst):
	gpx = minidom.parse(src).documentElement
	with open(dst, 'w') as f:
		for trk in gpx.childNodes:
			if trk.nodeName != 'trk':
				continue
			for trkseg in trk.getElementsByTagName('trkseg'):
				for trkpt in trkseg.getElementsByTagName('trkpt'):
					lat = trkpt.getAttribute('lat')
					lon = trkpt.getAttribute('lon')
					try:
						ele = trkpt.getElementsByTagName('ele')[0].firstChild.nodeValue
					except:
						ele = ''
					try:
						date = tstamp = ''
						date = trkpt.getElementsByTagName('time')[0].firstChild.nodeValue
						tstamp = str(time.mktime(time.strptime(date, '%Y-%m-%dT%H:%M:%SZ')))
					except:
						pass
					f.write(','.join([lat, lon, ele, date, tstamp]) + '\n')


if __name__ == '__main__':
	import sys
	assert len(sys.argv) <= 3
	if len(sys.argv) == 3:
		gpx_to_csv(sys.argv[1], sys.argv[2])
	else:
		import pymongo
		from pymongo.objectid import ObjectId
		db = pymongo.Connection().spoked
		spec = None
		if len(sys.argv) == 2:
			assert len(sys.argv[1]) == 24, "first arg must be an ObjectId"
			spec = {'_id': ObjectId(sys.argv[1])}
		for t in db.tracks.find(spec):
			gpx_to_csv('static/gpx/%s.gpx' % t['_id'], 'static/csv/%s.csv' % t['_id'])
