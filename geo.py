import math

RAD_FROM_DEG = math.pi / 180

# http://en.wikipedia.org/wiki/WGS84
WGS84_a = 6378137.0
WGS84_b = 6356752.3142
WGS84_e2 = (WGS84_a**2 - WGS84_b**2) / (WGS84_a**2)

def make_location_metric(lat):
	return (delta_lat_meters(lat), delta_lon_meters(lat))

# http://en.wikipedia.org/wiki/Latitude#The_length_of_a_degree_of_latitude
def delta_lat_meters(lat):
	phi = RAD_FROM_DEG * lat
	return RAD_FROM_DEG * WGS84_a * (1 - WGS84_e2) / (1 - WGS84_e2 * math.sin(phi)**2) ** 1.5
	#return 111132.954 - 559.822 * math.cos(2*phi) + 1.175 * math.cos(4*phi)

# http://en.wikipedia.org/wiki/Longitude#Length_of_a_degree_of_longitude
def delta_lon_meters(lat):
	phi = RAD_FROM_DEG * lat
	return RAD_FROM_DEG * WGS84_a * math.cos(phi) / math.sqrt(1 - WGS84_e2 * math.sin(phi)**2)

EQUATOR = make_location_metric(0)
NEW_YORK = make_location_metric(40.664167) # -73.938611
LAT_45 = make_location_metric(45)

def dist_meters(l1, l2, loc=None):
	if not loc:
		loc = make_location_metric( (l1[0] + l2[0]) / 2)
	return math.sqrt((loc[0] * (l2[0] - l1[0])) ** 2 +
	                 (loc[1] * (l2[1] - l1[1])) ** 2)

# some 2D vector utilities
def diff(v2, v1): return (v2[0] - v1[0], v2[1] - v1[1])
def dot(v1, v2): return v1[0]*v2[0] + v1[1]*v2[1]
def magsq(v): return v[0]**2 + v[1]**2

def angle(l1, l2, l3, loc=None):
	if not loc:
		loc = make_location_metric( (l1[0] + l2[0] + l3[0]) / 3)
	l1 = (l1[0] * loc[0], l1[1] * loc[1])
	l2 = (l2[0] * loc[0], l2[1] * loc[1])
	l3 = (l3[0] * loc[0], l3[1] * loc[1])
	a = diff(l2, l1)
	b = diff(l3, l2)
	cos = dot(a, b) / math.sqrt(magsq(a) * magsq(b))
	if cos >= 1: return 0 # clamp floating-point drift
	return math.acos(cos) / RAD_FROM_DEG
