import bson

def aggregate(user, db):
	if not isinstance(user, dict):
		user = db.users.find_one({'_id': bson.objectid.ObjectId(user)})
		assert user is not None

	print "Processing user", user['_id']

	duration = sum(t.get('duration', 0) for t in db.tracks.find({'userid': user['_id']}))
	db.users.update({'_id': user['_id']}, {'$set': {'total_duration': duration}})

if __name__ == '__main__':
	import sys
	import pymongo
	db = pymongo.Connection().spoked
	if len(sys.argv) > 1:
		for userid in sys.argv[1:]:
			aggregate(userid, db)
	else:
		for user in db.users.find():
			aggregate(user, db)
