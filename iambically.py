import datetime
import webapp2

from google.appengine.api import users
from google.appengine.ext import ndb


class Entry(ndb.Model):
  Committed = ndb.DateTimeProperty()
  Content = ndb.BlobProperty()

  def unixnano(self):
    epoch = datetime.datetime.utcfromtimestamp(0)
    return int((self.Committed - epoch).total_seconds() * 1000000000.0)


class Auth(webapp2.RequestHandler):
  def get(self):
    if not users.is_current_user_admin():
      return
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write('ok\n')


class Login(webapp2.RequestHandler):
  def get(self):
    if users.get_current_user() is None:
      self.redirect(users.create_login_url('/login'))
    else:
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.out.write('ok\n')


class Logout(webapp2.RequestHandler):
  def get(self):
    if users.get_current_user() is None:
      self.response.headers['Content-Type'] = 'text/plain'
      self.response.out.write('ok\n')
    else:
      self.redirect(users.create_login_url('/logout'))


class Fetch(webapp2.RequestHandler):
  def post(self):
    if not users.is_current_user_admin():
      return
    start = datetime.datetime.utcfromtimestamp(
        int(self.request.get('start', '0')) / 1000000000.0)
    query = Entry.query(Entry.Committed > start)
    entries = query.fetch(10)
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write('%d\n' % len(entries))
    for e in entries:
      self.response.out.write('%d %d %s\n' % (
          len(e.Content), e.unixnano(), e.key.urlsafe()))
      self.response.out.write(e.Content)


class Commit(webapp2.RequestHandler):
  def post(self):
    if not users.is_current_user_admin():
      return
    replaces = self.request.get('replaces', '')
    if replaces:
      e = ndb.Key(urlsafe=replaces).get()
    else:
      e = Entry()
    e.Committed = datetime.datetime.utcnow()
    e.Content = str(self.request.get('content'))
    e.put()
    self.response.headers['Content-Type'] = 'text/plain'
    self.response.out.write('%d %s\n' % (e.unixnano(), e.key.urlsafe()))


app = webapp2.WSGIApplication([
    ('/fetch', Fetch),
    ('/commit', Commit),
    ('/auth', Auth),
    ('/login', Login),
    ('/logout', Logout),
], debug=False)
