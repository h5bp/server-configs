from webapp2_extras.appengine.auth.models import User
from google.appengine.ext.ndb import model

class User(User):
    """
    Universal user model. Can be used with App Engine's default users API,
    own auth or third party authentication methods (OpenId, OAuth etc).
    based on https://gist.github.com/kylefinley
    """

    #: Creation date.
    created = model.DateTimeProperty(auto_now_add=True)
    #: Modification date.
    updated = model.DateTimeProperty(auto_now=True)
    #: User defined unique name, also used as key_name.
    username = model.StringProperty(required=True)
    #: User Name
    name = model.StringProperty()
    #: User Last Name
    last_name = model.StringProperty()
    #: User email
    email = model.StringProperty(required=True)
    #: Password, only set for own authentication.
    password = model.StringProperty(required=True)
    #: User Country
    country = model.StringProperty()
    
    @classmethod
    def get_by_email(cls, email):
        """Returns a user object based on an email.

        :param email:
            String representing the user email. Examples:

        :returns:
            A user object.
        """
        return cls.query(cls.email == email).get()
