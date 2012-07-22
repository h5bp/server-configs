# -*- coding: utf-8 -*-

"""
	A real simple app for using webapp2 with auth and session.

	It just covers the basics. Creating a user, login, logout
	and a decorator for protecting certain handlers.

    Routes are setup in routes.py and added in main.py

"""

import models.models as models
from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError
from webapp2_extras import security
from lib import utils
from lib import captcha
from lib.basehandler import BaseHandler
from lib.basehandler import user_required
from google.appengine.api import taskqueue
from google.appengine.api import mail
from google.appengine.api import app_identity
import logging
import config


class BootstrapHandler(BaseHandler):

    def get(self):
        """
              Returns a simple HTML form for home
        """
        params = {}
        return self.render_template('boilerplate_bootstrap.html', **params)


class HomeRequestHandler(BaseHandler):

    def get(self):
        """
              Returns a simple HTML form for home
        """
        params = {}
        return self.render_template('boilerplate_home.html', **params)


class PasswordResetHandler(BaseHandler):
    """
    Password Reset Handler with Captcha
    """
    reCaptcha_public_key = config.captcha_public_key
    reCaptcha_private_key = config.captcha_private_key
    
    def get(self):
        if self.user:
            self.redirect_to('secure')
        
        chtml = captcha.displayhtml(
            public_key = self.reCaptcha_public_key,
            use_ssl = False,
            error = None)
        params = {
            'action': self.request.url,
            'captchahtml': chtml,
        }
        return self.render_template('boilerplate_password_reset.html', **params)

    def post(self):
        # check captcha
        challenge = self.request.POST.get('recaptcha_challenge_field')
        response  = self.request.POST.get('recaptcha_response_field')
        remoteip  = self.request.remote_addr

        cResponse = captcha.submit(
            challenge,
            response,
            self.reCaptcha_private_key,
            remoteip)

        if cResponse.is_valid:
            # captcha was valid... carry on..nothing to see here
            pass
        else:
            logging.warning(cResponse.error_code)
            _message = 'Wrong image verification code. Please try again.'
            self.add_message(_message, 'error')
            return self.redirect_to('password-reset')
        #check if we got an email or username
        email_or_username = str(self.request.POST.get('email_or_username')).lower().strip()
        if utils.is_email_valid(email_or_username):
            user = models.User.get_by_email(email_or_username)
            _message = "If the e-mail address you entered <strong>%s</strong> " % email_or_username
        else:
            auth_id = "own:%s" % email_or_username
            user = models.User.get_by_auth_id(auth_id)
            _message = "If the username you entered <strong>%s</strong> " % email_or_username

        if user is not None:
            user_id = user.get_id()
            token = models.User.create_auth_token(user_id)
            email_send_url = self.uri_for('send-reset-email')
            taskqueue.add(url = email_send_url, params={
                'recipient_email': user.email,
                'token' : token,
                'user_id' : user_id,
                })
            _message = _message + "is associated with an account in our records, you will receive " \
                       "an e-mail from us with instructions for resetting your password. " \
                       "<br>If you don't receive this e-mail, please check your junk mail folder or " \
                       "<a href='/contact'>contact us</a> for further assistance."
            self.add_message(_message, 'success')
            return self.redirect_to('login')
        _message = 'Your email / username was not found. Please try another or <a href="/register">create an account</a>.'
        self.add_message(_message, 'error')
        return self.redirect_to('password-reset')


class SendPasswordResetEmailHandler(BaseHandler):
    """
    Hanlder for sending Emails
    Better use with TaskQueue
    """
    def post(self):
        user_address = self.request.get("recipient_email")
        user_token = self.request.get("token")
        user_id = self.request.get("user_id")
        reset_url = self.uri_for('password-reset-check', user_id=user_id, token=user_token, _full=True)
        app_id = app_identity.get_application_id()
        sender_address = "%s <no-reply@%s.appspotmail.com>" % (app_id, app_id)
        subject = "Password reminder"
        body = """
            Please click below to create a new password:

            %s
            """ % reset_url

        mail.send_mail(sender_address, user_address, subject, body)


class PasswordResetCompleteHandler(BaseHandler):

    def get(self, user_id, token):
        verify = models.User.get_by_auth_token(int(user_id), token)
        params = {
            'action': self.request.url,
            }
        if verify[0] is None:
            self.add_message('There was an error. Please copy and paste the link from your email or enter your details again below to get a new one.', 'warning')
            return self.redirect_to('password-reset')

        else:
            return self.render_template('boilerplate_password_reset_complete.html', **params)

    def post(self, user_id, token):
        verify = models.User.get_by_auth_token(int(user_id), token)
        user = verify[0]
        password = str(self.request.POST.get('password')).strip()
        c_password = str(self.request.POST.get('c_password')).strip()
        if user:
            if password == "" or c_password == "":
                message = 'Password required.'
                self.add_message(message, 'error')
                return self.redirect_to('password-reset-check', user_id=user_id, token=token)

            if password != c_password:
                message = 'Sorry, Passwords are not identical, ' \
                          'you have to repeat again.'
                self.add_message(message, 'error')
                return self.redirect_to('password-reset-check', user_id=user_id, token=token)

            # Password to SHA512
            password = utils.encrypt(password, config.salt)
        
            user.password = security.generate_password_hash(password, length=12)
            user.put()
            # Delete token
            models.User.delete_auth_token(int(user_id), token)
            # Login User
            self.auth.get_user_by_password(user.auth_ids[0], password)
            self.add_message('Password changed successfully', 'success')
            return self.redirect_to('secure')

        else:
            self.add_message('Please correct the form errors.', 'error')
            return self.redirect_to('password-reset-check', user_id=user_id, token=token)


class LoginHandler(BaseHandler):
    """
    Handler for authentication
    """
    def get(self):
        """
              Returns a simple HTML form for login
        """
        if self.user:
            self.redirect_to('secure', id=self.user_id)
        params = {
            "action": self.request.url,
        }
        return self.render_template('boilerplate_login.html', **params)

    def post(self):
        """
              username: Get the username from POST dict
              password: Get the password from POST dict
        """
        username = str(self.request.POST.get('username')).lower().strip()
        auth_id = "own:%s" % username
        password = self.request.POST.get('password')
        remember_me = True if str(self.request.POST.get('remember_me')) == 'on' else False

        # Password to SHA512
        password = utils.encrypt(password, config.salt)

        # Try to login user with password
        # Raises InvalidAuthIdError if user is not found
        # Raises InvalidPasswordError if provided password
        # doesn't match with specified user
        try:
            self.auth.get_user_by_password(
                auth_id, password, remember=remember_me)
            self.redirect_to('secure')
        except (InvalidAuthIdError, InvalidPasswordError), e:
            # Returns error message to self.response.write in
            # the BaseHandler.dispatcher
            message = "Login error, Try again"
            self.add_message(message, 'error')
            return self.redirect_to('login')


class ContactHandler(BaseHandler):
    """
    Handler for Contact Form
    """
    def get(self):
        """
              Returns a simple HTML for contact form
        """
        params = {
            "action": self.request.url,
            }
        if self.user:
            user_info = models.User.get_by_id(long(self.user_id))

            params.update({
                "name" : str(user_info.name) + " " + str(user_info.last_name),
                "email" : str(user_info.email),
            })

        return self.render_template('boilerplate_contact.html', **params)

    def post(self):
        """
              validate contact form
        """
        remoteip  = self.request.remote_addr
        user_agent  = self.request.user_agent
        name = str(self.request.POST.get('name')).strip()
        email = str(self.request.POST.get('email')).lower().strip()
        message = str(self.request.POST.get('message')).strip()

        if name == "" or email == "" or message == "":
            message = 'Sorry, some fields are required.'
            self.add_message(message, 'error')
            return self.redirect_to('contact')

        if not utils.is_email_valid(email):
            message = 'Sorry, your email %s is not valid.' % email
            self.add_message(message, 'error')
            return self.redirect_to('contact')

        try:
            app_id = app_identity.get_application_id()
            sender_address = "%s <no-reply@%s.appspotmail.com>" % (app_id, app_id)
            subject = "Contact"
            body = """
            IP Address : %s
            Web Browser  : %s

            Sender : %s <%s>
            %s
            """ % (remoteip, user_agent, name, email, message)

            mail.send_mail(sender_address, config.contact_recipient, subject, body)

            message = 'Message sent successfully.'
            self.add_message(message, 'success')
            return self.redirect_to('contact')

        except (AttributeError, KeyError), e:
            message = 'Error sending the message. Please try again later.'
            self.add_message(message, 'error')
            return self.redirect_to('contact')


class RegisterHandler(BaseHandler):
    """
    Handler for Register Users
    """
    def get(self):
        """
              Returns a simple HTML form for create a new user
        """
        if self.user:
            self.redirect_to('secure', id=self.user_id)
        params = {
            "action": self.request.url,
            }
        return self.render_template('boilerplate_register.html', **params)

    def post(self):
        """
              Get fields from POST dict
        """
        username = str(self.request.POST.get('username')).lower().strip()
        name = str(self.request.POST.get('name', "")).strip()
        last_name = str(self.request.POST.get('last_name', "")).strip()
        email = str(self.request.POST.get('email')).lower().strip()
        password = str(self.request.POST.get('password')).strip()
        c_password = str(self.request.POST.get('c_password')).strip()
        country = str(self.request.POST.get('country', "")).strip()

        if username == "" or email == "" or password == "":
            message = 'Sorry, some fields are required.'
            self.add_message(message, 'error')
            return self.redirect_to('register')

        if password != c_password:
            message = 'Sorry, Passwords are not identical, ' \
                      'you have to repeat again.'
            self.add_message(message, 'error')
            return self.redirect_to('register')

        if not utils.is_email_valid(email):
            message = 'Sorry, the email %s is not valid.' % email
            self.add_message(message, 'error')
            return self.redirect_to('register')

        if not utils.is_alphanumeric(username):
            message = 'Sorry, the username %s is not valid. ' \
                      'Use only letters and numbers' % username
            self.add_message(message, 'error')
            return self.redirect_to('register')

        # Password to SHA512
        password = utils.encrypt(password, config.salt)

        # Passing password_raw=password so password will be hashed
        # Returns a tuple, where first value is BOOL.
        # If True ok, If False no new user is created
        unique_properties = ['username','email']
        auth_id = "own:%s" % username
        user = self.auth.store.user_model.create_user(
            auth_id, unique_properties, password_raw=password,
            username=username, name=name, last_name=last_name, email=email,
            country=country, ip=self.request.remote_addr,
        )

        if not user[0]: #user is a tuple
            message = 'Sorry, This user {0:>s} ' \
                      'is already registered.'.format(username)# Error message
            self.add_message(message, 'error')
            return self.redirect_to('register')
        else:
            # User registered successfully, let's try sign in the user and redirect to a secure page.
            try:
                self.auth.get_user_by_password(user[1].auth_ids[0], password)
                message = 'Welcome %s you are now loged in.' % ( str(username) )
                self.add_message(message, 'success')
                return self.redirect_to('secure')

            except (AttributeError, KeyError), e:
                message = 'Unexpected error creating ' \
                          'user {0:>s}.'.format(username)
                self.add_message(message, 'error')
                self.abort(403)


class EditProfileHandler(BaseHandler):
    """
    Handler for Edit User Profile
    """
    @user_required
    def get(self):
        """
              Returns a simple HTML form for edit profile
        """
        params = {
            "action": self.request.url,
            }
        if self.user:
            user_info = models.User.get_by_id(long(self.user_id))

            params.update({
                "username" : str(user_info.username),
                "name" : str(user_info.name),
                "last_name" : str(user_info.last_name),
                "email" : str(user_info.email),
                "country" : str(user_info.country),
            })

        return self.render_template('boilerplate_edit_profile.html', **params)

    def post(self):
        """
              Get fields from POST dict
        """
        username = str(self.request.POST.get('username')).lower().strip()
        name = str(self.request.POST.get('name', "")).strip()
        last_name = str(self.request.POST.get('last_name', "")).strip()
        email = str(self.request.POST.get('email')).lower().strip()
        country = str(self.request.POST.get('country', "")).strip()

        if username == "" or email == "":
            message = 'Sorry, some fields are required.'
            self.add_message(message, 'error')
            return self.redirect_to('edit-profile')

        if not utils.is_email_valid(email):
            message = 'Sorry, the email %s is not valid.' % email
            self.add_message(message, 'error')
            return self.redirect_to('edit-profile')

        if not utils.is_alphanumeric(username):
            message = 'Sorry, the username %s is not valid. '\
                      'Use only letters and numbers' % username
            self.add_message(message, 'error')
            return self.redirect_to('edit-profile')

        #TODO: Update profile identifying unique_properties

        # Passing password_raw=password so password will be hashed
        # Returns a tuple, where first value is BOOL.
        # If True ok, If False no new user is created
        unique_properties = ['username','email']
        auth_id = "own:%s" % username
        user = self.auth.store.user_model.create_user(
            auth_id, unique_properties, password_raw=password,
            username=username, name=name, last_name=last_name, email=email,
            country=country, ip=self.request.remote_addr,
        )

        if not user[0]: #user is a tuple
            message = 'Sorry, This user {0:>s} '\
                      'is already registered.'.format(username)# Error message
            self.add_message(message, 'error')
            return self.redirect_to('register')
        else:
            # User registered successfully, let's try sign in the user and redirect to a secure page.
            try:
                self.auth.get_user_by_password(user[1].auth_ids[0], password)
                message = 'Welcome %s you are now loged in.' % ( str(username) )
                self.add_message(message, 'success')
                return self.redirect_to('secure')

            except (AttributeError, KeyError), e:
                message = 'Unexpected error creating '\
                          'user {0:>s}.'.format(username)
                self.add_message(message, 'error')
                self.abort(403)


class EditPasswordHandler(BaseHandler):
    """
    Handler for Edit User Password
    """
    @user_required
    def get(self):
        """
              Returns a simple HTML form for editing password
        """
        params = {
            "action": self.request.url,
            }
        return self.render_template('boilerplate_edit_password.html', **params)

    def post(self):
        """
              Get fields from POST dict
        """
        current_password = str(self.request.POST.get('current_password')).strip()
        password = str(self.request.POST.get('password')).strip()
        c_password = str(self.request.POST.get('c_password')).strip()

        if current_password == "" or password == "" or c_password == "":
            message = 'Sorry, some fields are required.'
            self.add_message(message, 'error')
            return self.redirect_to('edit-password')

        if password != c_password:
            message = 'Sorry, Passwords are not identical, '\
                      'you have to repeat again.'
            self.add_message(message, 'error')
            return self.redirect_to('edit-password')

        #TODO: Update profile identifying unique_properties

        user_info = models.User.get_by_id(long(self.user_id))

        logging.error(user_info)
        auth_id = "own:%s" % user_info.username

        verify = models.User.get_by_auth_password(auth_id, current_password)
        user = verify[0]
        if user:
            # Password to SHA512
            password = utils.encrypt(password, config.salt)

            user.password = security.generate_password_hash(password, length=12)
            user.put()
            # Login User
            coto = self.auth.get_user_by_password(user.auth_ids[0], password)
            logging.error(coto)
            self.add_message('Password changed successfully', 'success')
            return self.redirect_to('secure')

        else:
            self.add_message('Your current password is wrong, please try again.', 'error')
            return self.redirect_to('edit-password')


class LogoutHandler(BaseHandler):
    """
         Destroy user session and redirect to login
    """
    def get(self):
        if self.user:
            message = "You’ve signed out successfully." # Info message
            self.add_message(message, 'info')

        self.auth.unset_session()
        # User is logged out, let's try redirecting to login page
        try:
            self.redirect(self.auth_config['login_url'])
        except (AttributeError, KeyError), e:
            return "User is logged out, but there was an error " \
                   "on the redirection."


class SecureRequestHandler(BaseHandler):
    """
         Only accessible to users that are logged in
    """
    @user_required
    def get(self, **kwargs):
        user_session = self.user
        user_session_object = self.auth.store.get_session(self.request)

        user_info = models.User.get_by_id(long( self.user_id ))
        user_info_object = self.auth.store.user_model.get_by_auth_token(
            user_session['user_id'], user_session['token'])

        try:
            params = {
                "user_session" : user_session,
                "user_session_object" : user_session_object,
                "user_info" : user_info,
                "user_info_object" : user_info_object,
                "userinfo_logout-url" : self.auth_config['logout_url'],
                }
            return self.render_template('boilerplate_secure_zone.html', **params)
        except (AttributeError, KeyError), e:
            return "Secure zone error: %s." % e