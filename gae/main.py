#!/usr/bin/env python
##
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

__author__ = 'Rodrigo Augosto (@coto) - coto@protoboard.cl'
__website__ = 'www.protoboard.cl'

import webapp2
from webapp2_extras import jinja2 
import config
import routes
import os

def handle_error(request, response, exception):
    c = { 'exception': str(exception) }
    template = config.error_templates[exception.status_int]
    t = jinja2.get_jinja2(app=app).render_template(template, **c)
    response.write(t)
    response.set_status(exception.status_int)

app = webapp2.WSGIApplication(debug = os.environ['SERVER_SOFTWARE'].startswith('Dev'), config=config.webapp2_config)

app.error_handlers[404] = handle_error
app.error_handlers[500] = handle_error
routes.add_routes(app)

