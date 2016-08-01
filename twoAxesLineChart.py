from __future__ import unicode_literals
from IPython.display import display, HTML
import jinja2
import os
import json
import pandas as pd

jinja_environment = jinja2.Environment(autoescape=True,
                                       loader=jinja2.FileSystemLoader(
                                           os.path.join(os.path.dirname(__file__),
                                                        'templates')))

class twoAxesLineChart(object):
    pyd3_js_url = "files/d3.pyd3.js"
    d3_js_url = "files/d3.v3.min.js"
    css_url = "files/d3.pyd3.css"

    display(HTML("""<link media="all" href="%s" type="text/css"
                  rel="stylesheet"/>""" % (css_url)))
    display(HTML("<script src='%s'></script>" % (d3_js_url)))
    display(HTML("<script src='%s'></script>" % (pyd3_js_url)))


    display(HTML("""<link rel="stylesheet" href="files/bootstrap.min.css" type="text/css"/>"""))
    display(HTML("""<script type="text/javascript" src="files/jquery.min.js"></script>"""))
    display(HTML("""<script type="text/javascript" src="files/bootstrap.min.js"></script>"""))

    display(HTML("""<script type="text/javascript" src="files/bootstrap-multiselect.js"></script>"""))
    display(HTML("""<link rel="stylesheet" href="files/bootstrap-multiselect.css" type="text/css"/>"""))


    def __init__(self, dataframe, **kwargs):
        self.TEMPLATE_FILE = "twoAxesLineChart.html"
        self.df_json = dataframe.to_json(orient='records')
        self.series_count = len(dataframe.columns)
        dataframe_columns = list(dataframe.columns.values)

        # A list of accepted kwargs:
        self.x_serie = kwargs.get("x_serie", dataframe_columns[0])
        self.y_series = kwargs.get("y_series", dataframe_columns[1:self.series_count])

        self.filter_series = kwargs.get("filter_series", None)
        self.filter_values = {}
        if self.filter_series is not None:

            if not isinstance(self.filter_series, list):
                self.filter_series = [self.filter_series]

            for f in self.filter_series:
               self.filter_values[f] = list(dataframe[f].unique())

        # Accepted kwargs for DOM element
        self.x_axis_title = kwargs.get("x_axis_title", "")
        self.y_axis_title = kwargs.get("y_axis_title", "")
        self.second_y_axis_title = kwargs.get("second_y_axis_title", "")
        self.chart_title = kwargs.get("chart_title", "")
        self.margin_top = kwargs.get("margin_top", 40)
        self.margin_right = kwargs.get("margin_right", 100)
        self.margin_bottom = kwargs.get("margin_bottom", 60)
        self.margin_left = kwargs.get("margin_left",  80)
        self.canvas_width = kwargs.get("canvas_width",  960)
        self.canvas_height = kwargs.get("canvas_height", 400)
        self.width = kwargs.get('width', self.canvas_width - self.margin_left - self.margin_right)
        self.height = kwargs.get('height', self.canvas_height - self.margin_top - self.margin_bottom)
        self.legend_tick = kwargs.get("legend_tick", 'bar')
        self.legend_style = kwargs.get("legend_style", "expand")
        self.interpolation_method = kwargs.get("interpolation_method",  'cardinal')





    def show(self):

        template = jinja_environment.get_template(self.TEMPLATE_FILE)

        html_content = template.render(chart={"options": json.dumps(self, default=lambda o: o.__dict__),
                                              "data": self.df_json,
                                              "filters": self.filter_values})

        display(HTML(html_content))

