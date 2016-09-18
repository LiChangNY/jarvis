from __future__ import unicode_literals
from jinja2 import Environment, PackageLoader
from IPython.display import display, HTML, Javascript
import os
import jinja2
from pkg_resources import resource_string


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

# CONTENT_FILENAME = "./content.html"
# PAGE_FILENAME = "./page.html"


# pl = PackageLoader('jarvis', 'templates')
# jinja2_env = Environment(lstrip_blocks=True, trim_blocks=True, loader=pl)

# template_content = jinja2_env.get_template(CONTENT_FILENAME)
# template_page = jinja2_env.get_template(PAGE_FILENAME)


class Jarvis(object):
    """
    Jarvis Base class.
    """
    #: chart count
    _count = 0

    # this attribute is overriden by children of this
    # class
    # CHART_FILENAME = None
    # template_environment = Environment(lstrip_blocks=True, trim_blocks=True,
    #                                   loader=pl)

    global _JS_INITIALIZED

    if not _JS_INITIALIZED:
        display(HTML("""
            <style> %s </style>
            <script type="text/javascript"> %s </script>
            """ % (_get_file("files/d3.pyd3.css"), _get_file('pyd3.min.js'))))
        _JS_INITIALIZED = True

        #TODO: Bundle up css files.
#       display(HTML("""<link media="all" href="%s" type="text/css"
#       rel="stylesheet"/>""" % _get_file("jquery-ui.min.css")))
#       display(HTML("""<link rel="stylesheet" href="%s" type="text/css"/>"""
#                % _get_file("sumoselect.css")))

    def __init__(self, dataframe, **kwargs):

        # set the model
        self.model = self.__class__.__name__  #: The chart model
        self.chart_type = kwargs.get('chart_type', 'bar')

        if self.chart_type == 'map':
            self.map_type = kwargs.get('map_type', None)
            self.geo_unit_column = kwargs.get("unit", None)
            self.geo_value_column = kwargs.get("values", None)

            map_options = {
                "world": {"path": "files/maps/countries.json"},
                "usStates": {"path": "files/maps/us-states.json"},
                "orthographic": {"path": "files/maps/countries.json"}
            }

            map_type = map_options[self.map_type]
            map_file_path = map_type['path']
            topology = resource_string('jarvis', map_file_path).decode('utf-8')

            display(HTML("""
                <script type="text/javascript">
                    var topology = %s
                    console.log(mapKey, mapUnit);
                </script>""" % topology))

        self.TEMPLATE_FILE = "chartBuilder.html"
        self.df_json = dataframe.to_json(orient='records')
        self.series_count = len(dataframe.columns)
        dataframe_columns = list(dataframe.columns.values)

        self.enable_zoom = kwargs.get('enable_zoom', False)
        self.enable_click_to_center = kwargs.get("enable_click_to_center", False)

        self.filters = kwargs.get("filters", None)

        # Another way of id
        #if self.chart_type in Jarvis:
        #    Jarvis[self.chart_type]['count'] +=1
        #else:
        #    Jarvis[self.chart_type] = {'count': 0}
        #self._id = self.chart_type + "_" + str(Jarvis[self.chart_type]['count'])

        Jarvis._count += 1
        self._id = self.model + "_" + str(Jarvis._count) + "_" + self.chart_type


    def show(self):
        template = jinja_environment.get_template(self.TEMPLATE_FILE)

        html_content = template.render(chart={"options": json.dumps(self, default=lambda o: o.__dict__),
                                              "data": self.df_json,
                                              "filters": self.filters,
                                              "_id": self._id})


        display(HTML(html_content))


class d3map(Jarvis):

    def __init__(self, **kwargs):

        super(d3map, self).__init__(**kwargs)

        self.model = 'map'
        self.chart_type = kwargs.pop('chart_type', 'map')

