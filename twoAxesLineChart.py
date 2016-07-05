from __future__ import unicode_literals
from IPython.display import display, HTML
import jinja2
import os
import pandas as pd

jinja_environment = jinja2.Environment(autoescape=True,
                                       loader=jinja2.FileSystemLoader(
                                           os.path.join(os.path.dirname(__file__),
                                                        'templates')))

class twoAxesLineChart(object):
    pyd3_js_url = "files/d3.pyd3.js"
    d3_js_url = "files/d3.v3.min.js"
    css_url = "files/d3.pyd3.css"

    display(HTML('''<link media="all" href="%s" type="text/css"
                  rel="stylesheet"/>''' % (css_url)))
    display(HTML('<script src="%s"></script>' % (d3_js_url)))
    display(HTML('<script src="%s"></script>' % (pyd3_js_url)))
    display(HTML('<script src="%s"></script>' % (d3_js_url)))

    def __init__(self, dataframe, **kwargs):
        self.TEMPLATE_FILE = "twoAxesLineChart.html"
        self.df_json = dataframe.to_json(orient='records')
        self.series_count = len(dataframe.columns)
        dataframe_columns = list(dataframe.columns.values)

        # A list of accepted kwargs:
        self.x_serie = kwargs.get('x_serie', dataframe_columns[0].split())
        self.y_series = kwargs.get('y_series', dataframe_columns[1:self.series_count])
        self.templates_var = {'data': self.df_json,
                              'x_serie': self.x_serie,
                              'y_series': self.y_series}

    def show(self, **kwargs):

        template = jinja_environment.get_template(self.TEMPLATE_FILE)
        html_content = template.render(self.templates_var)

        display(HTML(html_content))

