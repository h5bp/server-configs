
GAEPATH = $(HOME)/bin/google_appengine
PORT=8089

PYLINTS = $(wildcard *.py \
	libs/*.py \
	)
PYLINTFILES = $(patsubst %.py,.%.lint,$(notdir $(PYLINTS)))
PYLINT = $(join $(dir $(PYLINTS)),$(PYLINTFILES))

PYTHONPATH=$(GAEPATH):$(GAEPATH)/lib/yaml/lib:$(GAEPATH)/lib/webob:$(GAEPATH)/lib/webapp2:$(GAEPATH)/lib/jinja2:.

APP=$(shell grep 'application:' app.yaml | sed -e 's/^application:\s*//g')
BRANCH=master

run:
	$(GAEPATH)/dev_appserver.py ./ --port=$(PORT) --datastore_path=/tmp/$(APP).dev_appserver.datastore


.%.lint: %.py
	@PYTHONPATH=$(PYTHONPATH) pychecker --only --no-miximport --no-override -Z __website__,__author__,__all__,__version__ $?
	@touch $@


lint: $(PYLINT)


clean:
	-rm ${PYLINT}


push: lint
	git push origin $(BRANCH)


upload:
	$(GAEPATH)/appcfg.py update --skip_sdk_update_check ./


push-and-upload: push upload


python:
	PYTHONPATH=$(PYTHONPATH) python


.PHONY: run lint clean push upload push-and-upload python
