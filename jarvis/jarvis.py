from __future__ import unicode_literals
from jinja2 import Environment, PackageLoader
from IPython.display import display, HTML
import os
import jinja2


try:
    import simplejson as json
except ImportError:
    import json

jinja_environment = jinja2.Environment(autoescape=True,
                                       loader=jinja2.FileSystemLoader(
                                           os.path.join(os.path.dirname(__file__),
                                                        'templates')))


# CONTENT_FILENAME = "./content.html"
# PAGE_FILENAME = "./page.html"


# pl = PackageLoader('jarvis', 'templates')
# jinja2_env = Environment(lstrip_blocks=True, trim_blocks=True, loader=pl)

# template_content = jinja2_env.get_template(CONTENT_FILENAME)
# template_page = jinja2_env.get_template(PAGE_FILENAME)


# Load js
# 1. load only once in each session.
# 2. When people refreshes the pages within the same session, js should also be loaded.

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

    ## TODO: Use a global js_global to prevent loading js again.
    pyd3_js_url = "pyd3.min.js"
    display(HTML("<script src='%s'></script>" % (pyd3_js_url)))
    css_url = "files/d3.pyd3.css"
    display(HTML("""<link media="all" href="%s" type="text/css"
                  rel="stylesheet"/>""" % (css_url)))
    display(HTML("""<link rel="stylesheet" href="files/jquery-ui.min.css" type="text/css"/>"""))
    display(HTML("""<link rel="stylesheet" href="files/sumoselect.css" type="text/css"/>"""))
    display(HTML("""<script>console.log("Loaded libraries.")</script>"""))

    def __init__(self, dataframe, **kwargs):

        # set the model
        self.model = self.__class__.__name__  #: The chart model
        self.chart_type = kwargs.get('chart_type', 'bar')

        if self.chart_type == 'map':
            self.map_type = kwargs.get('map_type', None)
            self.geo_unit_column = kwargs.get("unit", None)
            self.geo_value_column = kwargs.get("values", None)

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

