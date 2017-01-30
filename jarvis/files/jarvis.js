jarvis = (function() {

String.prototype.format = function () {

  var i = 0, args = arguments[0][0];
  return this.replace(/\{.*?\}/g, function () {
    return typeof args[i] != 'undefined' ? args[i++] : '';
  });
};

ChartBuilder = function(id, canvasWidth, canvasHeight, margin) {
    this._id = id;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
    this._margin = margin;
    this.colorSet = d3.scale.category10()
}

ChartBuilder.prototype.drawCanvas = function() {
    return d3
        .select(this._id)
        .attr("class", "jarvis-chart")
        .append("svg")
            .attr("width", this._canvasWidth)
            .attr("height", this._canvasHeight)
        .append("g")
            .attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
}

ChartBuilder.prototype.addTooltip = function(elements, tooltipText) {

        var self = this;

        var tooltip = d3.select(this._id).append("div")
            .attr("class", "jarvis-tooltip")
            .style("opacity", 0);

          elements
            .on("mouseover", function(d){

                var element = element || d;

                tooltip
                    .transition()
                    .duration(50)
                    .style("opacity", 1)

                //TODO: Fix positioning. Absolute positioning with d3.mouse only works for sankey, not radial
                //console.log(element)
                //console.log("element position:", element.x, element.y);
                //console.log("page position:", d3.event.pageX, d3.event.pageY);
                //console.log("mouse position", d3.mouse(this));
                //console.log($(this).position())
                //console.log($(self._id + " .jarvis-tooltip").position())
                //var $tooltip = $(self._id + " .jarvis-tooltip").position()
                //var position = $(this).position()
                //console.log(d3.transform(d3.select(this).attr("transform")).translate)
                //var rect = this.getBoundingClientRect()
                //console.log(rect)

                tooltip
                    .html(tooltipText(element))
                    .style("position", "absolute")
                    .style('font-size', '14px')
                    //.attr("transform", "translate(" + element.y + ")")
                    //.attr("transform", "translate(" + (pos[0]-element.x) + "," + (pos[1]- element.y) + ")")
                    //.attr("transform", "translate(" + element.x + "px," + element.y + "px)")
                    .style("left", (d3.mouse(this)[0]+30) + "px"  )
                    .style("top", (d3.mouse(this)[1]) + "px")

            })
            .on("mouseout", function() {
                tooltip
                    .transition()
                    .duration(100)
                    .style("opacity", 0)
            })

        return this;
    }

LineChartBuilder = function(id, canvasWidth, canvasHeight, width, height, margin, xSerie, ySeries,
                            data, colorSet) {

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

    var seriesCount = ySeries.length;
    var formatDate = d3.time.format("%Y-%m-%d");
    var parseDate = d3.time.format('%Y-%m-%d').parse;

    data.forEach(function(d) {

         d[xSerie] = parseDate(d[xSerie])
         ySeries.forEach(function(item, index){
            d[item] = +d[item];
          })

    });

    //sort data by date
    data.sort(function(a, b) {
      return a.xSerie - b.xSerie;
    })

    var nestData = function(data) {
        return ySeries.map(function(e) {
            return data.map(function(d) {
                var value = {};
                value['id'] = e;
                value[xSerie] = d[xSerie];
                value[e] = +d[e];
                return value;
            })

        })
    }

    var dataGrouped = nestData(data);

    this.drawTitle = function(x, y, title) {
        this.svg
            .append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("class", 'jarvis-chart-title')
                .text(title);

        return this;
    }

   var timeScale = function(range, domain) {
        return d3.time.scale()
            .range(range)
            .domain(domain);
    }

    var linearScale = function(range, domain) {
        return d3.scale.linear()
            .range(range)
            .domain(domain);

    }


    //TODO: Replace d.Date with xAxis
    //var xScale = timeScale([0, width - margin.right / 2], d3.extent(data, function(d) { return d.Date; }));

    var xScaleBuilder = function(data) {
        var xScaleMin = d3.min(data, function(d) { return d3.min(d, function (v) { return v[xSerie] })})
        , xScaleMax = d3.max(data, function(d) { return d3.max(d, function (v) { return v[xSerie] }) });

        return timeScale([0, width - margin.right / 2],[xScaleMin, xScaleMax])
    }

    var xScale = xScaleBuilder(dataGrouped)

    // Find min and max of y series.
    var yAxisMax = d3.max(dataGrouped, function(c) {
        return d3.max(c, function(v) {return v[v.id]; })
    } );

    var yScale = linearScale([height, margin.top],[0, yAxisMax] );

    var defineAxis = function(scale, orientation, ticks) {
        var axis = d3.svg.axis()
            .scale(scale)
            .orient(orientation);

        if (ticks) axis.ticks(ticks);

        return axis;
    }

    var xAxis = defineAxis(xScale, "bottom");
    var yAxis = defineAxis(yScale, "left");

    this.drawXAxis = function(axisPosition, titlePosition, title) {
        this.svg
            .append("g")
                .attr("class", "jarvis-axis")
                .attr("transform", "translate(" + axisPosition.x + ", " + axisPosition.y + ")")
                .call(xAxis)
            .append("text")
                .attr("transform", "translate(" + titlePosition.x + " ," + titlePosition.y + ")")
                .style("text-anchor", "middle")
                .text(title);

        return this;
    }

    this.drawGridLine = function() {
        // Draw the left y Grid lines
        this.svg.append("g")
          .attr("class", "grid")
          .call(yAxis
                  .tickSize(-width, 0, 0)
                  .tickFormat("")
               )
         return this;
    }

    this.drawYAxis = function(titlePosition, title ) {
        this.svg.append("g")
            .attr("class", "jarvis-axis")
            //.style('fill', 'steelblue')
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", titlePosition.x)
            .attr("y", titlePosition.y)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .text(title);

        return this;
    }


    this.drawLine = function(data) {

        if (!data) data = dataGrouped;

        var line = d3.svg.line()
            .interpolate('cardinal')
            .x(function(d) { return xScale(d[xSerie]); })
            .y(function(d) { return yScale(d[d.id]); });

        //Update svg
        var multiLines = this.svg
            .selectAll(".jarvis-line-g")
            .data(data)

        //Enter new data.
        multiLines
            .enter()
            .append("g")
                .attr("class", "jarvis-line-g")
            .append("path")
                .attr("class", "jarvis-line")
                .style("stroke", function(d, i) { return colorSet(i)})
                .attr("id", function(d, i) { return "line-"+i ;});

        //Update
         multiLines
            .select("path")
            .attr("d", line);

        //Remove old data.
        multiLines.exit().remove();

        return this;
    }

    this.drawLegend = function(height, position, legendTick, circleRadius) {
        this.legendHeight = height;

        this.legend = this.svg.append("g")
            .attr("class","jarvis-legend")
            .attr("transform", "translate(" + position.x + "," + position.y + ")")
            .selectAll("g")
            .data(d3.range(seriesCount))
            .enter().append("g");

        if (legendTick == 'circle') {
            this.drawCircleTicks();
        } else {
            this.drawRectTicks();
        };

        this.colorTicks();
        this.drawLabel();

        return this;
    }

    this.drawCircleTicks = function() {
        var self = this;
        return self.legend.append("circle")
                .attr("class", "jarvis-legend-tick")
                .attr("cx", function(d) { return margin.right / 4;})
                .attr("cy", function(d) { return d*(self.legendHeight/seriesCount); })
                .attr("r", function (d) { return circleRadius; })

    }

    this.drawRectTicks = function(){
        var self = this;
        return self.legend.append("rect")
                .attr("class", "jarvis-legend-tick")
                .attr('x', function(d) { return margin.right/5; })
                .attr('y', function(d) { return Math.floor(d*self.legendHeight/seriesCount); })
                .attr("width", 10)
                .attr("height", Math.floor(self.legendHeight/seriesCount) )

    }

    this.colorTicks = function() {
        return this.legend.selectAll('.jarvis-legend-tick')
               .attr("id", function(d) {return "legend-tick-" + d; })
               .style("fill", function(d) {return colorSet(d);})
               .style('stroke', function(d) {return colorSet(d);})
               .style('stroke-opacity',0.3)
                .on("click", function(d) {
                    toggleId('line-'+d);
                    toggleId('focus-'+d)
                    toggleId('legend-tick-'+d)
                })
    }


    this.drawLabel = function(){

        var self = this;

        return self.legend.append('text')
                .attr("y", function (d) { return (d+0.5)*(self.legendHeight/seriesCount); })
                .attr("x", function (d) { return  margin.right/3;})
                .attr("fill", function (d) {return colorSet(d); })
                .attr("text-anchor", "start")
                .on("click", function(d) {
                    toggleId('line-'+d);
                    toggleId('focus-'+d)
                    toggleId('legend-tick-'+d)
                })
                .text(function(d) {return ySeries[d]})

    }

    var toggleId = function(shape_id) {
        //Need to add [0] to access the attributes
        var active  = $("#"+shape_id)[0].active ? false : true
		, newOpacity = active ? 0 : 1;

		// Hide or show the elements
		d3.select("#"+shape_id).style("opacity", newOpacity);

		// Update whether or not the elements are active
		$("#"+shape_id)[0].active = active;
		//console.log($("#"+shape_id)[0].active);

    }


    //Draw focus circle
    this.drawFocusCircle = function() {
        var focus = this.svg.selectAll(".focus")
            .data(d3.range(seriesCount))
            .enter()
            .append("g")
            .attr("class", "jarvis-focus")
            .style('stroke', function(d) { return colorSet(d % 10); })
            .style("display", "none")
            .attr('id', function(d) { return 'focus-'+d; });

        focus.append("circle")
            .attr("r", 4.5);
        focus.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");
    };

    this.changeFocusCircleState = function(state) {
        this.svg.selectAll(".focus")
           .style("display", state);
    };


    this.mouseMoveFocusCircle = function(data, element){
        var bisectDate = d3.bisector(function(d) { return d[xSerie]; }).left;

        var x0 = xScale.invert(d3.mouse(element)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0[xSerie] > d1[xSerie] - x0 ? d1 : d0;

        this.svg.selectAll(".focus")
            .attr("transform", function(i) { return "translate(" + xScale(d[xSerie])  + ","
                   + yScale(d['Series ' + (i + 1)]) + ")";})
            .select("text")
                .text(function(i) { return formatDate(d[xSerie]) + ": "+ d['Series ' + (i + 1)]; })
                .style('fill', function(i) { return colorSet(i % 10); })
                .style('font-size', '10px');
    };


    this.updateFocusCircle = function(width, height) {
        var self = this;
        self.drawFocusCircle();
        self.svg.append("rect")
            .attr("class", "jarvis-overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() {self.changeFocusCircleState(null);})
            .on("mouseout", function() {self.changeFocusCircleState('none');})
            .on("mousemove", function() {self.mouseMoveFocusCircle(data, this)})

        return self;
    };


    this.setFilters = function(filters) {

        var that = this;

        filterDict = {};

        for (var f in filters) {

            var f_slugify = f.replace(' ', '-').toLowerCase();

            $("#filter-"+f_slugify).SumoSelect({ selectAll: true, okCancelInMulti: false });
            $("#filter-"+f_slugify).change(function() {
                that.updateData($(this), filterDict);
            });
        }

        return this;

    }


    //Loop though all filters and check data against filters. Once done, update svg.
    this.updateData = function(select, filterDict) {

        //jQuery thing to return name and values.
        var name = select.attr("name")
        , valueSelected = select.val()

        filterDict[name] = function(d) {

            var value = d[name];

            if (!value) return true;

            if (value instanceof Date) value=formatDate(value);

            return valueSelected.indexOf(value.toString()) > -1;
        };


        filterData = nestData(data);

        for (f in filterDict) {

            filterData = filterData.map(function(c) {
                return c.filter(filterDict[f]);
            })

        }

        //TODO: Clean up manual reset.
        xScale = xScaleBuilder(filterData);
        xAxis = defineAxis(xScale, "bottom");

        var t = this.svg.transition().duration(350);
        t.select(".x.axis").call(xAxis);
        this.drawLine(filterData);

        return this;
    };

    this.svg = this.drawCanvas();

    return this;
}

LineChartBuilder.prototype = Object.create(ChartBuilder.prototype)
LineChartBuilder.prototype.constructor = LineChartBuilder;
LineChartBuilder.prototype.parent = ChartBuilder.prototype;


var drawLineChart = function(data, options, filters) {

    //*** Init attributes *** //
    //TODO: Need to change the letter case.
    var xSerie =  options.x_serie
    , ySeries = options.y_series
    , filterSeries = options.filter_series
    , chartTitle = options.chart_title || ""
    , xAxisTitle = options.x_axis_title || ""
    , yAxisTitle = options.y_axis_title || ""

    var canvasWidth = options.canvasWidth || 960
    , canvasHeight = options.canvasHeight || 400
    , margin = {}
    margin.left = options.margin_left || 80
    margin.right = options.margin_right || 65
    margin.top = options.margin_top ||40
    margin.bottom = options.margin_bottom || 60

    var width = options.width || canvasWidth - margin.left - margin.right
    , height = options.height || canvasHeight - margin.top - margin.bottom
    , legendTick = options.legend_tick || "rect"
    , legendStyle = options.legend_style || "expand"
    , legendX = options.legend_x || width
    , legendY = options.legend_y || margin.top
    , circleRadius= options.circleRadius || 5

    var chartId = "#" + options._id


    var chart = new LineChartBuilder(chartId, canvasWidth, canvasHeight, width, height, margin, xSerie, ySeries, data, d3.scale.category10())
        .drawTitle(width / 2, margin.top / 2, chartTitle)
        .drawXAxis(axisPosition={x: 0, y: height},
                    titlePosition={x: width/2, y: margin.bottom/2}, xAxisTitle)
        .drawYAxis({x:-height/2, y:-margin.left/2}, yAxisTitle)
        .drawLine()
        .drawLegend(height, {x: legendX, y: legendY}, legendTick, circleRadius)
        .drawGridLine()
        .updateFocusCircle(width, height)
        .setFilters(filters)

}

MapBuilder = function(id, data, topology, projectionType, region, canvasWidth, canvasHeight,
                      width, height, margin, geoUnitColumn, geoValueColumn, scale, tooltipText) {

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

    this.svg = this.drawCanvas();

    var path = d3.geo.path(),
        g = this.svg.append("g"),
        projection;

    if (projectionType == 'mercator' && region == "world") {
        projection = d3.geo.mercator()
            .center([0,0])
            .scale(scale || 150)
            //.rotate([-180,0]);
    } else if (projectionType == 'orthographic') {

        projection = d3.geo.orthographic()
            .translate([width / 2, height / 2])
            .scale(scale || 150)
            .clipAngle(90)
            .precision(0.1)
            .rotate([0, -30]);

        //this.svg.attr('viewBox', '0, 0, ' + width + ', ' + height);

    } else if (projectionType == 'albersUsa') {
        projection = d3.geo.albersUsa()
            .translate([width / 2, height / 2])
            .scale(scale || 1000)
    }

    path.projection(projection);


    if (projectionType == 'orthographic') {

        g.append('path')
        .datum({type: 'Sphere'})
        .attr('class', 'jarvis-background')
        .attr('d', path);

        g.append('path')
          .datum(d3.geo.graticule())
          .attr('class', 'jarvis-graticule')
          .attr('d', path);

    }

    var drawBaseMap = function(topology, mapKey, mapUnit){

            return g.selectAll(mapUnit)
              .data(topojson.feature(topology, topology.objects[mapKey]).features)
              .enter()
             .append('g')
              .attr("class", "jarvis-"+mapUnit)
             .append("path")
              .attr('class', 'jarvis-land')
              .style("stroke", "white")
              .attr("d", path)
              .attr('data-id', function(d) {
                return d.id;
              })
              .attr('data-name', function(d) {
                return d.id;
              })
              .attr('data-value', function(d) {
                if (data) {
                    var match = data.find(function (d2) { return d2[geoUnitColumn] == d.id});

                    if (match) { return match[geoValueColumn]; }
                }
              })
    }

    var regionOptions = {
        world: {base: "files/maps/countries.json", key: 'units', unit: "country"},
        US: {base: "files/maps/us-states.json", key: "units", unit: "state"},
    };

    //If users use Python, typology should have been defined when Jarvis object is instantiated.
    //If users use the JS library directory, I will need to perform an asynchronous request o load map JSON.
    if (typeof topology == "undefined") {

        var topology;

        $.ajax({
          url:  regionOptions[region].base,
          async: false,
          dataType: 'json',
          success: function (result) {
            topology = result;
          }
        });
    }

    //Add a step to normalize data by assigning id.
    // data is an array of objects. Applied to countries only.
//    if (typeof countryLookup == "undefined") {
//
//        var countryLookup;
//
//        $.ajax({
//          url: "files/maps/countries-names.json",
//          async: false,
//          dataType: 'json',
//          success: function (result) {
//            countryLookup = result;
//
//            dataByUnit = d3.map(data, function(d) {return d[geoUnitColumn]})._
//
//           //Assign alpha-3 id to the raw getUnitColumn values.
//           for (key in dataByUnit) dataByUnit[key] = Object.assign({}, dataByUnit[key], countryLookup[key])
//
//           dataWithId = d3.values(dataByUnit);
//
//          }
//        });
//    }

    this.paths = drawBaseMap(topology, regionOptions[region].key, regionOptions[region].unit);
    this.path = path;
    this.projection = projection;


    this.addColor = function(options){

          var range = d3.extent(data, function(d) { return d[geoValueColumn]; })
          , setColor = d3.scale.category10()

            if (options.palette.constructor == Array){
                setColor = d3.scale.ordinal()
                            .range(options.palette);
            } else if (options.palette.constructor == Object) {
                setColor = d3.scale.linear()
                            .domain(range)
                            .range([options.palette.min, options.palette.max])
            } else if (options.palette.constructor = String) {
                setColor = function(d) {return options.palette;}
            }

            for (_opt in options) {

                this.paths.style(_opt, options[_opt])

            }

            this.paths
                .style('fill', function(d){
                return setColor(this.getAttribute("data-value"))})

            return this;
    }

   this.addTooltip = function(elements) {
       var tooltip = d3.select(id).append("div")
           .attr("class", "jarvis-tooltip")
           .style("opacity", 0)
         elements
           .on("mouseover", function(d) {
               tooltip
                   .transition()
                   .duration(50)
                   .style("opacity", 1)

               tooltip
                   .html(tooltipText(this))
                   .style("position", "absolute")
                   .style("left", (d3.mouse(this)[0]+30) + "px"  )
                   .style("top", (d3.mouse(this)[1]) + "px")
                   .style('font-size', '14px');
           })
           .on("mouseout", function() {
               tooltip
                   .transition()
                   .duration(100)
                   .style("opacity", 0);
           })
         return this;
   }

   this.enableZoom = function() {
        var svg = this.svg
        , projection = this.projection
        , path = this.path;

        var zoom = d3.geo.zoom()
            .projection(projection)
            .scaleExtent([projection.scale() * 0.7, projection.scale() * 8])
            .on('zoom.redraw', function(){
                d3.event.sourceEvent.preventDefault();
                svg.selectAll('path').attr('d',path);
            });

        svg.selectAll('path').call(zoom);
        return this;
   }

   this.enableClickToCenter = function () {
       var svg = this.svg
       , projection = this.projection
       , path = this.path;

        var clickToCenter = function(x) {
            var coords = d3.geo.centroid(x);
            coords[0] = -coords[0];
            coords[1] = -coords[1];

            d3.transition()
            .duration(1250)
            .tween('rotate', function() {
                var r = d3.interpolate(projection.rotate(), coords);
                return function(t) {
                   projection.rotate(r(t));
                   svg.selectAll('path').attr('d', path);
                };
            })
            .transition();
       };
        this.paths
            .on("click", function(x) {
                clickToCenter(x);
            });
        return this;
    }

    this.drawLegend = function(height, position) {

        //TODO: Make legend more progressive. Now it only has lowest and highest value.

        var legend = this.svg.append("g")
            .attr("class","jarvis-legend")
            .attr("transform", "translate(" + position.x + "," + position.y + ")")
            .selectAll("g")
            .data(colorDomain)
            .enter().append("g");

        var ls_w = 20, ls_h = 20;

        legend.append("rect")
          .attr("x", 20)
          .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
          .attr("width", ls_w)
          .attr("height", ls_h)
          .style("fill", function(d, i) { return colorScale(d); })
          .style("opacity", 0.8);

        legend.append("text")
          .attr("x", 50)
          .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
          .text(function(d, i){ return colorDomain[i]; });

        return this;
    }

    this.addMarker = function(options) {
        var shape = options.shape || 'circle'
        , color = options.color || "steelblue"
        , scale = options.scale || 1.0
        , opacity = options.opacity || 1.0
        , coordinate = options.coordinate || undefined
        , projection = this.projection;

        var markers = this.svg.selectAll(shape)
            .data(data).enter()
            .append(shape)
            //TODO: This should be replaced by marker-specific css. Use circle as default.
            .attr("class","jarvis-circle")
            .attr("id", function (d) { return d[geoUnitColumn];})
            .attr("cx", function (d) {
                return projection([d.long, d.lat])[0];
                })
            .attr("cy", function (d) {
                return projection([d.long, d.lat])[1];
             })
            .attr("r", function (d) {  return Math.log(d[geoValueColumn]) * scale; })
            .attr("fill", color)
            .attr('opacity', opacity)
            .attr("data-name", function(d) { return d[geoUnitColumn]; })
            .attr("data-value", function(d) { return d[geoValueColumn]; });

        this.addTooltip(markers, tooltipText);

        return this;
    }

    return this;
}

MapBuilder.prototype = Object.create(ChartBuilder.prototype);
MapBuilder.prototype.constructor = MapBuilder;
MapBuilder.prototype.parent = ChartBuilder.prototype;

function drawMapChart(data, options, topology) {

    var canvasWidth = options.canvasWidth || 960,
        canvasHeight = options.canvasHeight || 400,
        margin = {
            left: options.marginLeft || 80,
            right: options.marginRight || 65,
            top: options.marginTop || 40,
            bottom: options.marginBottom || 60
        },
        tooltipText = options.tooltipText || function(element) {
            var text = element.getAttribute("data-name");
            if (element.getAttribute("data-value")) {
                text += ": " + element.getAttribute("data-value");
            }
            return text;
        };

    var chart = new MapBuilder(
        "#" + options._id,
        data,
        topology,
        options.projectionType || "mercator",
        options.region || "US",
        canvasWidth,
        canvasHeight,
        options.width || canvasWidth - margin.left - margin.right,
        options.height || canvasHeight- margin.top - margin.bottom,
        margin,
        options.geoUnitColumn,
        options.geoValueColumn,
        scale = options.scale,
        tooltipText
    );

    var mapChartApi = {
        addColor: function(column, options) {
            chart.addColor(column, options);
            return mapChartApi;
        },

        addMarker: function(shape, scale, color) {
            chart.addMarker(shape, scale, color)
            return mapChartApi;
        },

        addTooltip: function() {
            chart.addTooltip(chart.paths);
            return mapChartApi;
        },

        enableZoom: function(){
            chart.enableZoom();
            return mapChartApi;
        },

        enableClickToCenter: function(){
            chart.enableClickToCenter();
            return mapChartApi;
        }
    }

    return mapChartApi;
}


TreeBuilder = function(id, data, childColumn, parentColumn,
    canvasWidth, canvasHeight, width, height, margin, diameter ) {

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

    var tree = d3.layout.tree()
        .size([360, diameter / 2 - 120])
        .separation(function(a, b) { return (a[parentColumn] == b[parentColumn] ? 1 : 2) / a.depth; });
    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

    this.svg = d3.select(this._id)
        .attr("class", "jarvis-chart")
        .append("svg")
        .attr("width", diameter)
        .attr("height", diameter - 100)
      .append("g")
        .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

    // In courtesy of https://gist.github.com/d3noob/8329404, you can generate
    // a tree array from flat data.
    // create a name: node map
    var dataMap = data.reduce(function(map, node) {
        map[node.name] = node;
        return map;
    }, {});


    // create the tree array
    var treeData = [];

    data.forEach(function(node) {

        var _parent = dataMap[node[parentColumn]];

        if (_parent) {

            (_parent.children || (_parent.children = []))
            .push(node);

        } else {

            treeData.push(node);
        }
    });

    var root = treeData[0],
        nodes = tree.nodes(root),
        links = tree.links(nodes);

    var link = this.svg.selectAll("link")
          .data(links)
        .enter().append("path")
          .attr("class", "jarvis-link")
          .attr("d", diagonal);

    this.node = this.svg.selectAll("node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "jarvis-node")
          .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

    //Add circle to each node.
    this.node.append("circle")
        .attr('class', 'jarvis-circle')

    //Add name labels to each circle
    this.node.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
      .text(function(d) { return d.name; });

    return this;

}

TreeBuilder.prototype = Object.create(ChartBuilder.prototype);
TreeBuilder.prototype.constructor = TreeBuilder;
TreeBuilder.prototype.parent = ChartBuilder.prototype;

function drawTreeChart(data, options) {

    // Required arguments
    var childColumn =  options.childColumn
    , parentColumn = options.parentColumn

    // Optional arguments
    var canvasWidth = options.canvasWidth || 960
    ,   canvasHeight = options.canvasHeight || 400
    ,   margin = {
            left: options.marginLeft || 80,
            right: options.marginRight || 65,
            top: options.marginTop || 40,
            bottom: options.marginBottom || 60
        }
    , diameter = options.diameter || 500

    var chart = new TreeBuilder(
        "#" + options._id,
        data,
        childColumn,
        parentColumn,
        canvasWidth,
        canvasHeight,
        options.width || canvasWidth - margin.left - margin.right,
        options.height || canvasHeight- margin.top - margin.bottom,
        margin,
        diameter
    );

    function defineTooltipText(tooltipColumn, tooltipTemplate, tooltipText) {

        if (tooltipTemplate != null) {

            var tooltipColumns = tooltipTemplate.match(/[^{}]+(?=\})/g);

            var tooltipText = function(d) {
                var tooltipTextArray = [];
                tooltipColumns.forEach(function(column){ tooltipTextArray.push(d[column]) });
                return tooltipTemplate.format([tooltipTextArray]);
            };

        } else if (tooltipColumn != null) {
            var tooltipText = function(d) {return d[tooltipColumn]}
        }

        return tooltipText

    }

    var treeChartApi = {

        addTooltip: function(options){

            var tooltipColumn = options.column || null
            , tooltipTemplate = options.template || null
            , tooltipText = defineTooltipText(tooltipColumn, tooltipTemplate, tooltipText) ||
            function(d) {return childColumn + ": " + d[childColumn]}

            chart.node
                .append("title")
                .attr("class", "jarvis-tooltip")
                .text(tooltipText)

            return treeChartApi;
        }
    }

    return treeChartApi;
}


SankeyBuilder = function(id, links, nodes, canvasWidth, canvasHeight, width, height, margin, tooltipText) {

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

    this.svg = this.drawCanvas();

    // Modified from https://bl.ocks.org/austinczarnecki/cc6371af0b726e61b9ab
    var formatNumber = d3.format(",.0f"),
        format = function(d) { return formatNumber(d); },
        color = d3.scale.category20();

    var sankey = d3.sankey()
                 .nodeWidth(35)
                 .nodePadding(10)
                 .size([width, height]);

    var path = sankey.link();

    sankey.nodes(nodes)
        .links(links)
        .layout(32);

    this.link = this.svg.append("g")
                .selectAll(".jarvis-link")
                .data(links)
                .enter().append("path")
                .attr("class", "jarvis-link")
                .attr("d", path)
                .style("stroke-width", function(d) { return Math.max(1, d.dy); })
                .sort(function(a, b) { return b.dy - a.dy; });

    var node = this.svg.append("g").selectAll(".jarvis-node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "jarvis-node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function() { this.parentNode.appendChild(this); })
        .on("drag", dragmove));

    sankey.relayout();

    node.filter(function(d) { return d.value != 0; }) // append text only if node value is not zero
        .append("rect")
        .attr("height", function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) {
            return d.color = color(d.name);
        })
        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
      .append("title")
        .text(function(d) { return d.name + "\n" + format(d.value); });

    node.filter(function(d) { return d.value != 0; }) // append text only if node value is not zero
        .append("text")
        .attr("x", -6)
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) { return d.name; })
        .filter(function(d) { return d.x == 0; }) // at first column append text after column
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    var self = this;

    function dragmove(d) {
      d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) +  ")");
      sankey.relayout();
      self.link.attr("d", path);
    }

    return this;
}

SankeyBuilder.prototype = Object.create(ChartBuilder.prototype);
SankeyBuilder.prototype.constructor = SankeyBuilder;
SankeyBuilder.prototype.parent = ChartBuilder.prototype;

function drawSankeyChart(data, options) {

    // Required arguments
    var sourceColumn =  options.sourceColumn
    , targetColumn = options.targetColumn
    , valueColumn = options.valueColumn

    // Optional arguments
    var canvasWidth = options.canvasWidth || 960
    ,   canvasHeight = options.canvasHeight || 400
    ,   margin = {
            left: options.marginLeft || 80,
            right: options.marginRight || 65,
            top: options.marginTop || 40,
            bottom: options.marginBottom || 60
        }


    // A very clever solution by http://www.d3noob.org/2013/02/formatting-data-for-sankey-diagrams-in.html
    graph = {"nodes" : [], "links" : []};

    data.forEach(function (d) {
      graph.nodes.push({ name: d[sourceColumn] });
      graph.nodes.push({ name: d[targetColumn] });
      graph.links.push({ source: d[sourceColumn],
                         target: d[targetColumn],
                         value: +d[valueColumn] });
     });

     // return only the distinct / unique nodes
     graph.nodes = d3.keys(d3.nest()
       .key(function (d) { return d.name; })
       .map(graph.nodes));

     // loop through each link replacing the text with its index from node
     graph.links.forEach(function (d, i) {
       graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
       graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
     });

     // now loop through each nodes to make nodes an array of objects
     // rather than an array of strings
     graph.nodes.forEach(function (d, i) {
       graph.nodes[i] = { "name": d };
     });

    //Can't apply defineTooltipText here because sankey.js uses fixed keys: source, target, value
    var tooltipText = function(d) {
        return d.source.name + " to " + d.target.name + ": " + d.value
    }

    var chart = new SankeyBuilder(
        "#" + options._id,
        graph.links,
        graph.nodes,
        canvasWidth,
        canvasHeight,
        options.width || canvasWidth - margin.left - margin.right,
        options.height || canvasHeight- margin.top - margin.bottom,
        margin,
        tooltipText
    );

    var sankeyChartApi = {
        addLinkTooltip: function() {
           chart.addTooltip(chart.link, tooltipText);
           return sankeyChartApi;
        }
    }
    return sankeyChartApi

}

//Go Luke!
ForceBuilder = function(id, links, nodes, canvasWidth, canvasHeight, width, height, margin, tooltipText){

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

    this.svg = this.drawCanvas();

    var self = this;

    this.tick = function() {

      self.link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      self.node
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    //Adapted from http://bl.ocks.org/mbostock/2706022
    var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(60)
    .charge(-220)
    .on("tick", this.tick)
    .start();


    this.link = this.svg.selectAll(".jarvis-link")
        .data(force.links())
      .enter().append("line")
        .attr("class", "jarvis-link")


    this.node = this.svg.selectAll(".jarvis-node")
        .data(force.nodes())
      .enter().append("g")
        .attr("class", "jarvis-node")
        .call(force.drag);

    this.node.append("circle")
        .attr("class", "jarvis-circle")

    this.node.append("text")
        .attr("dy", ".35em")
        .attr("dx", "1em")
        .text(function(d) { return d.name; });

    return this;

}

ForceBuilder.prototype = Object.create(ChartBuilder.prototype);
ForceBuilder.prototype.constructor = ForceBuilder;
ForceBuilder.prototype.parent = ChartBuilder.prototype;

function drawForceGraph(data, options){

    // Required arguments
    var sourceColumn =  options.sourceColumn
    , targetColumn = options.targetColumn
    , _nodes = options.nodes
    , _links = data

    // Optional arguments
    var canvasWidth = options.canvasWidth || 960
    ,   canvasHeight = options.canvasHeight || 400
    ,   margin = {
            left: options.marginLeft || 80,
            right: options.marginRight || 65,
            top: options.marginTop || 40,
            bottom: options.marginBottom || 60
        }
    ,  tooltipText = options.tooltipText || function(d) {
        return d.source.name + " to " + d.target.name;
   }

    _links.forEach(function(_link) {
      _link.source = _nodes[_link.source]
      _link.target = _nodes[_link.target]
    });

    var chart = new ForceBuilder(
        "#" + options._id,
        _links,
        _nodes,
        canvasWidth,
        canvasHeight,
        options.width || canvasWidth - margin.left - margin.right,
        options.height || canvasHeight- margin.top - margin.bottom,
        margin,
        tooltipText
    );

    var forceGraphApi = {

        addTooltip: function(){
            chart.node
                .append('title')
                .attr("class", "jarvis-tooltip")
                .text(function(d) { return d.tooltip; })
            return forceGraphApi;
        },
        addLinkTooltip: function() {

            chart.addTooltip(chart.link, tooltipText);
            return forceGraphApi;

        },

        addColor: function(column, options) {

            var range = d3.extent(d3.values(_nodes), function(d){ return d[column]});
            var setColor = d3.scale.category10();

            if (options.palette.constructor == Array){
                setColor = d3.scale.ordinal()
                            .range(options.palette);
            } else if (options.palette.constructor == Object) {
                setColor = d3.scale.linear()
                            .domain(range)
                            .range([options.palette.min, options.palette.max])
            } else if (options.palette.constructor = String) {
                setColor = function(d) {return options.palette;}
            }

            for (_opt in options) {

                chart.node.selectAll('.jarvis-node .jarvis-circle')
                    .style(_opt, options[_opt])

            }

            chart.node.selectAll('.jarvis-node .jarvis-circle')
                .style('stroke', function(d){ return (options.stroke)? setColor(d[column]): null;})
                .style('fill', function(d){ return (options.fill)? setColor(d[column]): null;})

            return forceGraphApi;
        },

        sizeNode: function(column, scale) {

            var scale = scale || 1;

            chart.node.selectAll('.jarvis-node .jarvis-circle')
                .style('r', function(d){ return d[column]*scale;})
            return forceGraphApi;
        }
    }

    return forceGraphApi;
}


return {
    LineChart: drawLineChart,
    MapChart: drawMapChart,
    TreeChart: drawTreeChart,
    SankeyChart: drawSankeyChart,
    ForceGraph: drawForceGraph

};

})();