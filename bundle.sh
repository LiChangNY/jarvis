#!/bin/bash
uglifyjs files/jquery.min.js \
         files/jquery-ui.min.js \
         files/topojson.v1.min.js \
         files/d3.v3.min.js \
         files/d3.pyd3.js \
         -o files/pyd3.min.js