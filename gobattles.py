#!/usr/bin/env python

import json
import logging
import config
from flask import Flask, request, render_template

log = logging.getLogger(__name__)

# Setup flask app.
log.info('Create flask app.')
app = Flask(__name__, static_url_path=None)

# Enable our pre-configured root logger
app.logger.handlers = []
app.logger.propagate = True

fast_data = json.loads(open("static/fastMoves.txt", "r").read())
charge_data = json.loads(open("static/chargeMoves.txt", "r").read())
pokemon_data = json.loads(open("static/pokemon.txt", "r").read())
type_data = json.loads(open("static/types.txt").read())

def is_pretty():
    """
    Determines whether or not to return the result in a human easily readable format.
    :return: true for tab indents
    """
    pretty = request.args.get('pretty', default=False)
    if isinstance(pretty, str):
        if pretty.lower() in ['true', 'yes', 'on']:
            return True
        else:
            return False


def check_request(request, target_content_type = "application/json"):
    """
    Checks a http request for properly formatted arguments.
    :param request: The content of the request (as a string)
    :param target_content_type: The type of content that this should match (default json)
    :return: None, or an error.
    """
    log.info("Checking request...")
    length = request.content_length
    content_type = request.content_type
    log.info("Checking conditions")
    if content_type != target_content_type:
        error = 'Invalid Content-Type: %s' % content_type, 400
        log.info("content type")
        log.info(error)
        return error
    if length == 0:
        log.info("missing")
        error = 'Missing content', 400
        log.info(error)
        return error
    if length > 1024 * 1024 * 2:  # limit input to 2mb (huge for text)
        error = 'Content is too large, max is 2mb', 400
        log.info("too big")
        log.info(error)
        return error
    log.info("passed all")
    return None


@app.route('/', methods=['GET'])
def index():
    log.info("Request to see index page.")
    data = {
        "charge": charge_data,
        "fast": fast_data,
        "pokemon": pokemon_data,
        "types": type_data,
        "numCounters": range(6)
    }

    return render_template('index.html', data=data)

@app.route('/fast', methods=['GET'])
def fast():
    log.info("Request to see fast data.")

    resp = fast_data
    pretty = is_pretty()
    if pretty:
        out = json.dumps(resp, indent=4)
    else:
        out = json.dumps(resp)
    return out

@app.route('/charge', methods=['GET'])
def charge():
    log.info("Request to see charge data.")

    resp = charge_data
    pretty = is_pretty()
    if pretty:
        out = json.dumps(resp, indent=4)
    else:
        out = json.dumps(resp)
    return out

@app.route('/types', methods=['GET'])
def types():
    log.info("Request to see type data.")

    resp = type_data
    pretty = is_pretty()
    if pretty:
        out = json.dumps(resp, indent=4)
    else:
        out = json.dumps(resp)
    return out

@app.route('/pokemon', methods=['GET'])
def pokemon():
    log.info("Request to see pokemon data.")

    resp = pokemon_data
    pretty = is_pretty()
    if pretty:
        out = json.dumps(resp, indent=4)
    else:
        out = json.dumps(resp)
    return out

if __name__ == '__main__':
    import os
    host = config.app_host
    port = config.app_port
    debug = config.app_debug

    app.run(host=host, port=port, debug=debug)
