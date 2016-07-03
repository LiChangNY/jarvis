from IPython.display import display, HTML
import jinja2
import os

jinja_environment = jinja2.Environment(autoescape=True,
    loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))

class twoAxesLineChart():

    def __init__(self):
        pass

    def draw(self, **kwarg):

      templates_var = {'data': """[
      {'Date': '2015-01-01', "Series 1":100 , "Series 2": 200 },
      {'Date': '2015-01-15', "Series 1":20 , "Series 2": 60 },
      {'Date': '2015-02-01', "Series 1":200 , "Series 2": 200 },
      {'Date': '2015-02-15', "Series 1":40 , "Series 2": 90 },
      {'Date': '2015-03-01', "Series 1":300 , "Series 2": 400 },
     ]"""};


      pyd3_js_url = "files/d3.pyd3.js"
      d3_js_url ="files/d3.v3.min.js"
      css_url = "files/d3.pyd3.css"

      display(HTML('''<link media="all" href="%s" type="text/css"
                      rel="stylesheet"/>''' % (css_url)))
      display(HTML('<script src="%s"></script>' % (d3_js_url)))
      display(HTML('<script src="%s"></script>' % (pyd3_js_url)))
      display(HTML('<script src="%s"></script>' % (d3_js_url)))

      TEMPLATE_FILE = "twoAxesLineChart.html"
      template = jinja_environment.get_template( TEMPLATE_FILE )

      html = template.render(templates_var)

      display(HTML(html))
