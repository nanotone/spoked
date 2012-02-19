import email
import email.header
import imaplib
import time

import imapclient

class MailClient(object):

	def __init__(self, host, username, password):
		attempts = 3
		while True:
			try:
				self.client = imapclient.IMAPClient(host, use_uid=True, ssl=True)
				self.client.login(username, password)
				self.client.select_folder('INBOX')
				print "Login success", time.time()
			except imaplib.IMAP4.abort:
				print "error"
				attempts -= 1
				if not attempts: raise
				time.sleep(1)
			else:
				break

	def list_msgs(self, sender=None, attachment=None):
		filters = []
		if sender:
			filters.append('FROM "%s"' % sender)
		if attachment:
			filters.append('X-GM-RAW "has:attachment"')
		uids = self.client.search(filters)
		return uids

	def get_msg(self, uid):
		data = self.client.fetch(uid, ['RFC822'])[uid]
		return email.message_from_string(data['RFC822'])

	def close(self):
		self.client.logout()


def get_attachment(msg, ext=None):
	if msg.is_multipart():
		for part in msg.get_payload():
			attachment = get_attachment(part, ext)
			if attachment:
				return attachment
	else:
		filename = msg.get_filename()
		if isinstance(filename, str):
			filename = email.header.decode_header(filename)[0][0]
			if ext is None or filename.endswith('.' + ext):
				return msg

def get_first_text(msg):
	if msg.is_multipart():
		for part in msg.get_payload():
			text = get_first_text(part)
			if text:
				return text
	elif msg.get_content_type() in ('text/html', 'text/plain'):
		return msg.get_payload(decode=True)

def parse_sender(header):
	if '<' in header and header.endswith('>'):
		(one, two) = header.split('<')
		addr = two[:-1]
		one = one.strip()
		if one.startswith('"') and one.endswith('"'):
			one = one[1:-1]
		name = email.header.decode_header(one)[0][0]
		return (addr, name)
	return (header, '')


