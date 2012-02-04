from google.appengine.ext import webapp
from google.appengine.ext.webapp import util

class IndexHandler(webapp.RequestHandler):
    def get(self):
        if self.request.url.endswith('/'):
            path = '%sindex.html'%self.request.url
        else:
            path = '%s/index.html'%self.request.url

        self.response.headers.add_header('X-UA-Compatible', 'IE=Edge,chrome=1')
        self.redirect(path)
        

    def post(self):
        self.get()

def main():
    application = webapp.WSGIApplication([('/.*', IndexHandler)],
                                         debug=False)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()