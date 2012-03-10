db = None

def setup_db():
	global db
	if not db:
		import pymongo
		db = pymongo.Connection().spoked

def userid_from_spec(spec):
	user = db.users.find_one(spec)
	return user['_id'] if user else None

def userid_from_sender(sender):
	return (sender[0] and userid_from_spec({'email': sender[0]})) or \
	       (sender[1] and userid_from_spec({'name' : sender[1]})) or None

if __name__ == '__main__':
	setup_db()
	for track in db.tracks.find():
		if not track['userid']:
			userid = userid_from_sender(track['sender'])
			if userid:
				print track['sender'], "matches", userid
				track['userid'] = userid
				db.tracks.save(track)
