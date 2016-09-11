#!/bin/bash
uglifyjs jarvis/files/jquery.min.js \
         jarvis/files/jquery-ui.min.js \
         jarvis/files/topojson.v1.min.js \
         jarvis/files/jquery.sumoselect.min.js \
         jarvis/files/d3.v3.min.js \
         jarvis/files/d3.geo.zoom.js \
         jarvis/files/d3.pyd3.js \
         -o jarvis/pyd3.min.js