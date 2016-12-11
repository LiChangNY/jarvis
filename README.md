# jarvis (Just Another Visualization Tool)
Built on top of d3, jarvis is a visualization library that can be rendered in a browser or Jupyter Notebook. Hence, people who don't know javascript or d3 can make some nice, interactive charts in mininal Python code.

## Releases
No exact release plan yet. I am still working on the MVP version and have prototyped a few templates in mind. There're much more to do, e.g. adding filter control, color options, etc.

## Chart Types
If you want to visualize basic graphes (e.g., line charts, bar charts, and pie charts, etc.), there're many open-source libraries - To name a few, nvd3, plotly, and altair - that would fulfill your purpose and certainly each has its own pros and cons. The current plan for jarvis is to focus on more complex charts that are not used very commonly. For example:

1. Force-directed graph

<img src="https://github.com/LiChangNY/jarvis/blob/master/img/force%20graph.png" width="600" height="450">

2. Sankey chart

<img src="https://github.com/LiChangNY/jarvis/blob/master/img/sankey.png" width="600" height="450">

3. Radial chart

<img src="https://github.com/LiChangNY/jarvis/blob/master/img/radial.png" width="600" height="450">

4. Geo-map

<img src="https://github.com/LiChangNY/jarvis/blob/master/img/map.png" width="600" height="450">

5. A map with orthographic projection

<img src="https://github.com/LiChangNY/jarvis/blob/master/img/globe.png" width="600" height="450">

See more examples here: https://lichangny.github.io/jarvis/. You can also download the [test.ipynb](https://github.com/LiChangNY/jarvis/blob/master/jarvis/test.ipynb) to see how to render charts in Jupyter Notebook.