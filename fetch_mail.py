import email.utils
import json
import re
import subprocess
import time

import pymongo

import gmail
import pipeline
import user


if __name__ == '__main__':
	db = pymongo.Connection().spoked
	user.db = db

	subprocess.call(['mkdir', '-p', 'data/gpx'])

	seen_mailids = set(m.get('mailid') for m in db.tracks.find(None))

	yes = gmail.MailClient(**json.load(open('config.json')))

	unseen_mailids = set(yes.list_msgs(attachment=True)) - seen_mailids

	for mailid in unseen_mailids:
		print "Fetching message", mailid
		msg = yes.get_msg(mailid)
		sender = gmail.parse_sender(msg['From'])
		if sender[0] == 'noreply@motionx.com':
			text = gmail.get_first_text(msg)
			match = re.search(r'([^<>]+)uses MotionX-GPS', text)
			if match:
				sender = ('', match.group(1).strip())

		gpx = gmail.get_attachment(msg, 'gpx')
		mail_time = time.mktime(email.utils.parsedate(msg['Date']))

		userid = user.userid_from_sender(sender)
		doc = {'mailid': mailid, 'time': mail_time, 'sender': sender, 'gpx_complete': False,
		       'userid': userid}
		db.tracks.update({'mailid': mailid}, doc, upsert=True)

		track_id = db.tracks.find_one({'mailid': mailid})['_id']
		gpx_path = 'data/gpx/%s.gpx' % track_id

		with open(gpx_path, 'w') as f:
			f.write(gpx.get_payload(decode=True))

		#kmz = gmail.get_attachment_by_ext(msg, 'kmz')
		#with open('%d.kmz' % mailid, 'w') as f:
		#	f.write(kmz.get_payload(decode=True))

		track_result = pipeline.pipeline(track_id, db)
		db.tracks.update({'mailid': mailid}, {'$set': {'gpx_complete': True}})
		if userid:
			db.users.update({'_id': userid}, {'$inc': {'total_duration': track_result['duration']}})

	yes.close()

# if get_payload(decode=True) barfs on equal signs, it may be a CRLF issue. Look at
# http://stackoverflow.com/questions/787739/python-email-get-payload-decode-fails-when-hitting-equal-sign

