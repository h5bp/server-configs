
__author__ = 'Rodrigo Augosto (@coto) - coto@protoboard.cl'
__website__ = 'www.protoboard.cl'

import operator
import re
import logging
from lib import utils
from lib import languages
from google.appengine.api.urlfetch_errors import DownloadError
from google.appengine.api import urlfetch


def __findall(pattern, string):
    """
    Break up string into pieces (languages and q factors)
    """
    res = {}
    for match in re.finditer(pattern, string):
        if None == match.group(4):
            key = 1
        else:
            key = match.group(4)
        res[match.group(1)] = int(100*float(key))
    return res

def get_country(cls):
    """
    Detect th country origin with the IP
    Returns us, ca, cl, ar, etc.
    You can get the flag with http://geoip.wtanaka.com/flag/us.gif
    """
    country = "CL"
    try:
        result = urlfetch.fetch("http://geoip.wtanaka.com/cc/"+cls.request.remote_addr)
        if result.status_code == 200:
            fetch = result.content
            if len(str(fetch)) < 3:
                country = str(fetch).upper()
            else:
                logging.warning("Ups, geoip.wtanaka.com is not working. Look what it returns: "+ str(fetch) )
        else:
            logging.warning("Ups, geoip.wtanaka.com is not working. Status Code: "+ str(result.status_code) )
    except DownloadError:
        logging.warning("Couldn't resolve http://geoip.wtanaka.com/cc/"+cls.request.remote_addr)
    return country


def get_languages(cls, type="array"):
    """
    Detect languages from request.header (accept-language)
    or from url fetch service if the first one does not works

    cls: self object

    type: (optional) can be "array", "tuple" or "original"
    and defines how to return the information
    """
    accept_language = None
    arrLang = []

    try:
        accept_language = cls.request.headers["Accept-Language"]
    except NameError:
        logging.warning("i18n | Nameerror for accept_language")
        accept_language = None
    except AttributeError:
        logging.warning("i18n | AttributeError for accept_language")
        accept_language = None
    except KeyError:
        logging.warning("i18n | KeyError for accept_language")
        accept_language = None

    if accept_language is None:
        # Get language with url fetch based on IP
        tupleLang = get_country(cls)
        accept_language = tupleLang
        arrLang.append(tupleLang)
    else:
        tupleLang = __findall('([a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})?)\s*(;\s*q\s*=\s*(1|0\.[0-9]+))?', accept_language)

        # sort list based on value
        tupleLang = sorted(tupleLang.iteritems(), key=operator.itemgetter(1), reverse=True)

        # look through sorted list and use first one that matches our languages
        for lang in tupleLang:
            arrLang.append(lang[0])
    if type == "array":
        giveValue = arrLang
    elif type == "tuple":
        giveValue = tupleLang
    elif type == "original":
        giveValue = accept_language
    else:
        giveValue = arrLang
    return giveValue


def set_lang_cookie_and_return_dict(cls, force=""):
    """
    set language returning a dict and set cookie
    """
    if force != "":
        lang_cookie = force
    elif cls.request.get("hl") == "":
        # ask for cookie
        lang_cookie = utils.read_cookie(cls, "hl")
        arrLang = str(get_languages(cls)[0]).lower()
        if not lang_cookie:
            if arrLang.find("es") >= 0:
                lang_cookie = "es"
            else:
                lang_cookie = "en"
    else:
        # set cookie to param 'hl' value
        lang_cookie = cls.request.get("hl")
        # Two weeks for hl cookie
    utils.write_cookie(cls, "hl", str(lang_cookie), "/", 1209600)

    try:
        lang = {
            'en': languages.en,
            'es': languages.es,
            'it': languages.it,
            'cn': languages.cn,
        }[lang_cookie]
    except KeyError:
        lang = {
            'en': languages.en,
            'es': languages.es,
            'it': languages.it,
            'cn': languages.cn,
        }['en']
    return lang