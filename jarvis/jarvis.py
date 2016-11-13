from __future__ import unicode_literals
from jinja2 import Environment, PackageLoader
from IPython.display import display, HTML, Javascript
import os
import jinja2
from pkg_resources import resource_string
import pandas as pd


try:
    import simplejson as json
except ImportError:
    import json

_JS_INITIALIZED = False

jinja_environment = jinja2.Environment(autoescape=True,
                                       loader=jinja2.FileSystemLoader(
                                           os.path.join(os.path.dirname(__file__),'templates')
                                       ))

def _get_file(file):

    global _JS_INITIALIZED

    if not _JS_INITIALIZED:
        js_string = resource_string('jarvis', file).decode('utf-8')

        return js_string

class Jarvis(object):
    """
    Jarvis Base class.
    """
    #: chart count
    _count = 0

    global _JS_INITIALIZED

    if not _JS_INITIALIZED:
        display(HTML("""
            <style> %s </style>
            <script type="text/javascript"> %s </script>
            """ % (_get_file("files/jarvis.css"),
                   _get_file('jarvis.min.js')
                   )))
        _JS_INITIALIZED = True

        #TODO: Bundle up css files.
#       display(HTML("""<link media="all" href="%s" type="text/css"
#       rel="stylesheet"/>""" % _get_file("jquery-ui.min.css")))
#       display(HTML("""<link rel="stylesheet" href="%s" type="text/css"/>"""
#                % _get_file("sumoselect.css")))

    def __init__(self, dataframe, *args, **kwargs):

        self.model = self.__class__.__name__  #: The chart model

        self.canvas_height = kwargs.get("canvas_height", 400)
        self.canvas_weight = kwargs.get("canvas_weight", 900)


        self.TEMPLATE_FILE = "chartBuilder.html"
        self.df_json = dataframe.to_json(orient='records')
        self.series_count = len(dataframe.columns)
        dataframe_columns = list(dataframe.columns.values)

        self.enable_zoom = kwargs.get('enable_zoom', False)
        self.enable_click_to_center = kwargs.get("enable_click_to_center", False)

        self.filters = kwargs.get("filters", None)

        Jarvis._count += 1
        self._id = self.model.lower() + "_" + str(Jarvis._count)

        template = jinja_environment.get_template(self.TEMPLATE_FILE)

        options = self.__dict__.copy()
        options.pop('df_json')

        self.chart_options = {#"options": json.dumps(self, default=lambda o: o.__dict__),
                              "options": json.dumps(options),
                              "data": self.df_json,
                              "filters": self.filters,
                              "_id": self._id,
                              "model": self.model}

        if hasattr(self, 'additional_chart_options') and self.additional_chart_options:

            self.chart_options.update(self.additional_chart_options)

        html_content = template.render(chart=self.chart_options)

        display(HTML(html_content))

    def addColor(self):
        display(HTML("""
            <script type="text/javascript">
                %s.addColor();
            </script>
        """ % self._id))
        return self;

    def addCircle(self, scale):
        display(HTML("""
            <script type="text/javascript">
                %s.addCircle(%f);
            </script>
        """ % (self._id, scale)))
        return self;

    def addTooltip(self):
        display(HTML("""
            <script type="text/javascript">
                %s.addTooltip();
            </script>
        """ % self._id))
        return self;

    def enableZoom(self):
        display(HTML("""
            <script type="text/javascript">
                %s.enableZoom();
            </script>
        """ % self._id))
        return self;


    def enableClickToCenter(self):
        display(HTML("""
            <script type="text/javascript">
                %s.enableClickToCenter();
            </script>
        """ % self._id))
        return self;


class MapChart(Jarvis):


    def __init__(self, dataframe, projection="mercator", region=None, unit=None, value=None,
                 *args, **kwargs):

        self.projection_type = projection
        self.region = region
        self.geo_unit_column=unit
        self.geo_value_column=value

        map_options = {
            "world": {"path": "files/maps/countries.json"},
            "US": {"path": "files/maps/us-states.json"},
        }

        map_region = map_options[self.region]
        map_file_path = map_region['path']
        topology = resource_string('jarvis', map_file_path).decode('utf-8')

        self.additional_chart_options = {"topology": topology}

        super(MapChart, self).__init__(dataframe, *args, **kwargs)


class TreeChart(Jarvis):

    def __init__(self, dataframe, type = 'radial', child_col=None, parent_col=None, *args, **kwargs):

        self.type = type
        self.child_col = child_col
        self.parent_col = parent_col
        self.diameter = kwargs.get('diameter', 600)

        super(TreeChart, self).__init__(dataframe, *args, **kwargs)


class SankeyChart(Jarvis):

    def __init__(self, dataframe, source_col='source',target_col='target', value_col='value', *args, **kwargs):

        self.source_col = source_col
        self.target_col = target_col
        self.value_col = value_col

        super(SankeyChart, self).__init__(dataframe, *args, **kwargs)



class ForceGraph(Jarvis):

    def __init__(self, dataframe, source_col='source',target_col='target', *args, **kwargs):

        self.source_col = source_col
        self.target_col = target_col

        super(ForceGraph, self).__init__(dataframe, *args, **kwargs)