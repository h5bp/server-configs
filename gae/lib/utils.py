import os
import re
import hashlib
import Cookie
from datetime import datetime
from datetime import timedelta


def encrypt(plaintext, salt="", sha="512"):
    """ Returns the encrypted hexdigest of a plaintext and salt"""

    if sha == "1":
        phrase = hashlib.sha1()
    elif sha == "256":
        phrase = hashlib.sha256()
    else:
        phrase = hashlib.sha512()
    phrase.update("%s@%s" % (plaintext, salt))
    return phrase.hexdigest()


def write_cookie(cls, COOKIE_NAME, COOKIE_VALUE, path, expires=7200):
    """
    Write a cookie
    @path = could be a cls.request.path to set a specific path
    @expires = seconds (integer) to expire the cookie, by default 2 hours ()
    expires = 7200 # 2 hours
    expires = 1209600 # 2 weeks
    expires = 2629743 # 1 month
    """

    # days, seconds, then other fields.
    time_expire = datetime.now() + timedelta(seconds=expires)
    time_expire = time_expire.strftime("%a, %d-%b-%Y %H:%M:%S GMT")

    cls.response.headers.add_header(
        'Set-Cookie', COOKIE_NAME+'='+COOKIE_VALUE+'; expires='+str(time_expire)+'; path='+path+'; HttpOnly')
    return


def read_cookie(cls, name):
    """
    Use: cook.read(cls, COOKIE_NAME)
    """

    string_cookie = os.environ.get('HTTP_COOKIE', '')
    cls.cookie = Cookie.SimpleCookie()
    cls.cookie.load(string_cookie)
    value = None
    if cls.cookie.get(name):
        value  = cls.cookie[name].value

    return value


def get_date_time(format="%Y-%m-%d %H:%M:%S", UTC_OFFSET=3):
    """
    Get date and time in UTC for Chile with a specific format
    """

    local_datetime = datetime.now()
    now = local_datetime - timedelta(hours=UTC_OFFSET)
    if format != "datetimeProperty":
        now = now.strftime(format)
    #    now = datetime.fromtimestamp(1321925140.78)
    return now


def is_email_valid(email):
    if len(email) > 7:
        if re.match("^.+\\@(\\[?)[a-zA-Z0-9\\-\\.]+\\.([a-zA-Z]{2,3}|[0-9]{1,3})(\\]?)$", email) != None:
            return 1
    return 0


def is_alphanumeric(field):
    if re.match("^\w+$", field) is not None:
        return 1
    return 0


def get_device(cls):
    uastring = cls.request.user_agent
    is_mobile = (("Mobile" in uastring and "Safari" in uastring) or \
	 ("Windows Phone OS" in uastring and "IEMobile" in uastring) or \
     ("Blackberry") in uastring)

    if "MSIE" in uastring:
        browser = "Explorer"
    elif "Firefox" in uastring:
        browser = "Firefox"
    elif "Presto" in uastring:
        browser = "Opera"
    elif "Android" in uastring and "AppleWebKit" in uastring:
        browser = "Chrome for andriod"
    elif "iPhone" in uastring and "AppleWebKit" in uastring:
        browser = "Safari for iPhone"
    elif "iPod" in uastring and "AppleWebKit" in uastring:
        browser = "Safari for iPod"
    elif "iPad" in uastring and "AppleWebKit" in uastring:
        browser = "Safari for iPad"
    elif "Chrome" in uastring:
        browser = "Chrome"
    elif "AppleWebKit" in uastring:
        browser = "Safari"
    else:
        browser = "unknown"

    device = {
        "is_mobile": is_mobile,
        "browser": browser,
        "uastring": uastring
    }

    return device


def set_device_cookie_and_return_bool(cls, force=""):
    """
    set a cookie for device (dvc) returning a dict and set cookie
    Cookie value has to be "mobile" or "desktop" string
    """
    if force != "":
        # force cookie to param
        device_cookie = force
    elif cls.request.get("device") == "":
        # ask for cookie of device
        device_cookie = str(read_cookie(cls, "dvc"))
        if not device_cookie or device_cookie == "None" or device_cookie == "":
            # If cookie has an error, check which device is been used
            if get_device(cls)["is_mobile"]:
                device_cookie = "mobile"
            else:
                device_cookie = "desktop"
    else:
        # set cookie to param 'is_mobile' value directly
        device_cookie = cls.request.get("device")

    # Set Cookie for Two weeks with 'device_cookie' value
    write_cookie(cls, "dvc", str(device_cookie), "/", 1209600)
    return device_cookie == "mobile"
