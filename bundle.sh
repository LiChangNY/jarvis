#!/bin/bash
uglifyjs files/jquery.min.js \
         files/jquery-ui.min.js \
         files/topojson.v1.min.js \
         files/d3.v3.min.js \
         #files/bootstrap-multiselect.min.js \
         files/d3.geo.zoom.js \
         files/d3.pyd3.js \
         -o pyd3.min.js