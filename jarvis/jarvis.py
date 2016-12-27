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
    #chart count
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

        self.canvasHeight = kwargs.get("canvas_height", 400)
        self.canvasWeight = kwargs.get("canvas_weight", 900)


        self.TEMPLATE_FILE = "chartBuilder.html"
        self.df_json = dataframe.to_json(orient='records')
        self.seriesCount = len(dataframe.columns)
        dataframe_columns = list(dataframe.columns.values)

        self.tooltipColumn = kwargs.get("tooltip_column", None)
        self.tooltipTemplate = kwargs.get("tooltip_template", None)

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

        self.html_content = template.render(chart=self.chart_options)

    def addColor(self):

        self.html_content += """
            <script type="text/javascript">
                %s.addColor();
            </script>
        """ % self._id

        return self;

    def addCircle(self, scale):

        self.html_content += """
            <script type="text/javascript">
                %s.addCircle(%f);
            </script>
        """ % (self._id, scale)

        return self;

    def addTooltip(self):

        self.html_content += """
            <script type="text/javascript">
                %s.addTooltip();
            </script>
        """ % self._id

        return self;

    def addLinkTooltip(self):

        self.html_content += """
            <script type="text/javascript">
                %s.addLinkTooltip();
            </script>
        """ % self._id

        return self;

    def enableZoom(self):

        self.html_content += """
            <script type="text/javascript">
                %s.enableZoom();
            </script>
        """ % self._id

        return self;


    def enableClickToCenter(self):

        self.html_content += """
            <script type="text/javascript">
                %s.enableClickToCenter();
            </script>
        """ % self._id

        return self;

    def show(self):

        display(HTML(self.html_content))


class MapChart(Jarvis):


    def __init__(self, dataframe, projection="mercator", region=None, unit=None, value=None,
                 *args, **kwargs):

        self.projectionType = projection
        self.region = region
        self.geoUnitColumn=unit
        self.geoValueColumn=value

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

    def __init__(self, dataframe, child_column, parent_column, type = 'radial', *args, **kwargs):

        self.type = type
        self.childColumn = child_column
        self.parentColumn = parent_column
        self.diameter = kwargs.get('diameter', 600)

        super(TreeChart, self).__init__(dataframe, *args, **kwargs)


class SankeyChart(Jarvis):

    def __init__(self, dataframe, source_column, target_column, value_column, *args, **kwargs):

        self.sourceColumn = source_column
        self.targetColumn = target_column
        self.valueColumn = value_column

        super(SankeyChart, self).__init__(dataframe, *args, **kwargs)



class ForceGraph(Jarvis):

    def __init__(self, links_dataframe, source_column,target_column,
                 nodes, nodes_name_column=None, nodes_tooltip_column=None, *args, **kwargs):

        links_df = links_dataframe.copy()
        if any(x not in links_df.columns.values for x in [source_column, target_column]):
            raise Exception("source_column and target_column must be present in link_dataframe and nodes object.")

        self.sourceColumn = source_column
        self.targetColumn = target_column
        links_df.rename(columns={source_column: 'source', target_column: "target"}, inplace=True)

        self.nodes = {}
        if isinstance(nodes, (list, set)):
            for name in nodes:
                self.nodes[name] = {'name': name}
        elif isinstance(nodes, pd.DataFrame):

            nodes_df = nodes.copy()
            nodes_df.rename(columns={nodes_name_column: 'name', nodes_tooltip_column: 'tooltip'}, inplace=True)

            # orient = 'index' will be the best. http://pandas.pydata.org/pandas-docs/stable/generated/pandas.DataFrame.to_dict.html
            for d in nodes_df.to_dict(orient='record'):
                self.nodes[d['name']] = d

        links_df_nodes = set(links_df['source']) | set(links_df['target'])

        if links_df_nodes != set(self.nodes.keys()):
            raise Exception("nodes_name_column should have the same set of values as \
                            source_column and target_column combined in links_dataframe.")

        super(ForceGraph, self).__init__(links_df, *args, **kwargs)