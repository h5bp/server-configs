
import webapp2
from webapp2_extras import jinja2
from webapp2_extras import auth
from webapp2_extras import sessions
from lib import i18n
from lib import utils
import config
import re

def user_required(handler):
    """
         Decorator for checking if there's a user associated
         with the current session.
         Will also fail if there's no session present.
    """

    def check_login(self, *args, **kwargs):
        """
            If handler has no login_url specified invoke a 403 error
        """
        auth = self.auth.get_user_by_session()
        if not auth:
            try:
                self.redirect(self.auth_config['login_url'], abort=True)
            except (AttributeError, KeyError), e:
                self.abort(403)
        else:
            return handler(self, *args, **kwargs)

    return check_login


class BaseHandler(webapp2.RequestHandler):
    """
        BaseHandler for all requests

        Holds the auth and session properties so they
        are reachable for all requests
    """

    def dispatch(self):
        """
            Get a session store for this request.
        """
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def auth(self):
        return auth.get_auth()

    @webapp2.cached_property
    def session_store(self):
        return sessions.get_store(request=self.request)

    @webapp2.cached_property
    def session(self):
        # Returns a session using the default cookie key.
        return self.session_store.get_session()

    @webapp2.cached_property
    def messages(self):
        return self.session.get_flashes(key='_messages')

    def add_message(self, message, level=None):
        self.session.add_flash(message, level, key='_messages')

    @webapp2.cached_property
    def auth_config(self):
        """
              Dict to hold urls for login/logout
        """
        return {
            'login_url': self.uri_for('login'),
            'logout_url': self.uri_for('logout')
        }

    @webapp2.cached_property
    def user(self):
        return self.auth.get_user_by_session()

    @webapp2.cached_property
    def user_id(self):
        return str(self.user['user_id']) if self.user else None

    @webapp2.cached_property
    def username(self):
        import models.models as models
        if self.user:
            user_info = models.User.get_by_id(long(self.user_id))
            return str(user_info.username)
        return  None
    
    @webapp2.cached_property
    def email(self):
        import models.models as models
        if self.user:
            user_info = models.User.get_by_id(long(self.user_id))
            return str(user_info.email)
        return  None

    @webapp2.cached_property
    def path_for_language(self):
        """
        Get an path + query_string without language parameter (hl=something)
        Useful to put it in the template to concatenate with '&hl=NEW_LANGUAGE'
        """
        path_lang = re.sub(r'(^hl=(\w{2})\&*)|(\&hl=(\w{2})\&*?)', '', str(self.request.query_string))

        return self.request.path + "?" if path_lang == "" else str(self.request.path) + "?" + path_lang

    @webapp2.cached_property
    def is_mobile(self):
        return utils.set_device_cookie_and_return_bool(self)

    def jinja2_factory(self, app):
        j = jinja2.Jinja2(app)
        j.environment.filters.update({
            # Set filters.
            # ...
        })
        j.environment.globals.update({
            # Set global variables.
            'uri_for': webapp2.uri_for,
        })
        j.environment.tests.update({
            # Set tests.
            # ...
        })
        return j

    @webapp2.cached_property
    def jinja2(self):
        return jinja2.get_jinja2(factory=self.jinja2_factory, app=self.app)

    def render_template(self, filename, **kwargs):
        kwargs.update({
            'google_analytics_code' : config.google_analytics_code,
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'url': self.request.url,
            'path': self.request.path,
            'query_string': self.request.query_string,
            'path_for_language': self.path_for_language,
            'lang': i18n.set_lang_cookie_and_return_dict(self),
            'lang_native': i18n.languages,
            'is_mobile': self.is_mobile,
            })
        kwargs.update(self.auth_config)
        if self.messages:
            kwargs['messages'] = self.messages

        self.response.headers.add_header('X-UA-Compatible', 'IE=Edge,chrome=1')
        self.response.write(self.jinja2.render_template(filename, **kwargs))