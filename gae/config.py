

webapp2_config = {}
webapp2_config['webapp2_extras.sessions'] = {
    'secret_key': '_PUT_KEY_HERE_YOUR_SECRET_KEY_',
    }
webapp2_config['webapp2_extras.auth'] = {
    'user_model': 'models.models.User',
    'cookie_name': 'session_name'
}

contact_recipient = "rodrigo.augosto@gmail.com"

salt = "_PUT_SALT_HERE_TO_SHA512_PASSWORDS_"

# get your own recaptcha keys by registering at www.google.com/recaptcha
captcha_public_key = "6LfUI9ESAAAAAGYPG443J5pddULoYMCG0vLHa47_"
captcha_private_key = "6LfUI9ESAAAAAIgNTwGtPrRaCY-VqijrBVR85Zdj"

google_analytics_code = "UA-15733015-4"

error_templates = {
    404: 'errors/default_error.html',
    500: 'errors/default_error.html',
}
