var pyd3 = (function() {

// This is the ChartBuilder constructor
// It gets called whenever you new up a class that inherits from ChartBuilder or whenever
// you new up a ChartBuilder itself
ChartBuilder = function(id, canvasWidth, canvasHeight, margin) {
    this._id = id;
    this._canvasWidth = canvasWidth;
    this._canvasHeight = canvasHeight;
    this._margin = margin;
}

ChartBuilder.prototype.drawCanvas = function() {
    return d3
        .select(this._id)
        .append("svg")
            .attr("width", this._canvasWidth)
            .attr("height", this._canvasHeight)
        .append("g")
            .attr("transform", "translate(" + this._margin.left + "," + this._margin.top + ")");
}

// This is the LineChartBuilder constructor
// It gets called whenever you new up a LineChartBuilder
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
                .attr("class", 'chart-title')
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
                .attr("class", "x axis")
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
            .attr("class", "y axis")
            .style('fill', 'steelblue')
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
            .selectAll(".line-g")
            .data(data)

        //Enter new data.
        multiLines
            .enter()
            .append("g")
                .attr("class", "line-g")
            .append("path")
                .attr("class", "line")
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
            .attr("class","legend")
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
                .attr("class", "legend tick")
                .attr("cx", function(d) { return margin.right / 4;})
                .attr("cy", function(d) { return d*(self.legendHeight/seriesCount); })
                .attr("r", function (d) { return circleRadius; })

    }

    this.drawRectTicks = function(){
        var self = this;
        return self.legend.append("rect")
                .attr("class", "legend tick")
                .attr('x', function(d) { return margin.right/5; })
                .attr('y', function(d) { return Math.floor(d*self.legendHeight/seriesCount); })
                .attr("width", 10)
                .attr("height", Math.floor(self.legendHeight/seriesCount) )

    }

    this.colorTicks = function() {
        return this.legend.selectAll('.legend.tick')
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
            .attr("class", "focus")
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
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() {self.changeFocusCircleState(null);})
            .on("mouseout", function() {self.changeFocusCircleState('none');})
            .on("mousemove", function() {self.mouseMoveFocusCircle(data, this)})

        return self;
    };


    this.setFilters = function(filters) {

        filterDict = {};

        for (var f in filters) {

            var f_slugify = f.replace(' ', '-').toLowerCase();

            $("#filter-"+f_slugify).multiselect({
                enableCaseInsensitiveFiltering: true,
                includeSelectAllOption: true,
                //Bootstrap thing. Have to define update functions for all three events.
                onChange: function(option, checked) { updateData(this.$select, filterDict);},
                onSelectAll: function(checked) { updateData(this.$select, filterDict); },
                onDeselectAll: function(checked) { updateData(this.$select, filterDict); }
            })
        }

        return this;

    }


    //Loop though all filters and check data against filters. Once done, update svg.
    var updateData = function(select, filterDict) {

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

        var t = svg.transition().duration(350);
        t.select(".x.axis").call(xAxis);
        drawLine(filterData);

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
    var xSerie =  options.x_serie
    , ySeries = options.y_series
    , filterSeries = options.filter_series
    , chartTitle = options.chart_title || ""
    , xAxisTitle = options.x_axis_title || ""
    , yAxisTitle = options.y_axis_title || ""

    var canvasWidth = options.canvas_width || 960
    , canvasHeight = options.canvas_height || 400
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


    var chart = new LineChartBuilder('#chart1', canvasWidth, canvasHeight, width, height, margin, xSerie, ySeries, data, d3.scale.category10())
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

MapBuilder = function(id, data, type, canvasWidth, canvasHeight,
                      width, height, margin, geoUnitColumn, geoValueColumn) {

    // Call parent constructor with arguments
    ChartBuilder.call(this, id, canvasWidth, canvasHeight, margin);

   //TODO: Add color palettes
   if (data != null) {
       var dataByUnits = d3.map();

       var valueMin = d3.min(data, function(d) { return d[geoValueColumn]})
        , valueMax = d3.max(data, function(d) { return d[geoValueColumn] });

       var colorDomain = [valueMin, valueMax];

       var colorScale = d3.scale.linear()
                      .domain(colorDomain)
                      .range(['#F0F8FF', '#003300']);

       // TODO: geoValueColumn can be multiple.
       data.forEach(function(d) {dataByUnits.set(d[geoUnitColumn], +d[geoValueColumn]);})
    }

    //TODO: Give options to load users' own map
    var mapType = {
        world: {base: "files/maps/countries.json", mapKey: 'units'},
        usStates: {base: "files/maps/us-states.json", mapKey: "units"},
        orthographic: {base: "files/maps/countries.json", mapKey: "units"}
    }


    this.drawMap = function(data, center, scale, rotate, pathStyle) {

        var path = d3.geo.path()
        , graticule = d3.geo.graticule();

        if (type == 'world') {

            var projection = d3.geo.mercator()
                .center(center)
                .scale(scale)
                //.rotate([-180,0]);

            path.projection(projection);

        } else if (type == 'orthographic') {

            var projection = d3.geo.orthographic()
                .translate([width / 2, height / 2])
                .scale(scale)
                .clipAngle(90)
                .precision(0.1)
                .rotate([0, -30]);

            path.projection(projection);
        }

        var g = this.svg.append("g");


        if (type == 'orthographic') {
            g.append('path')
                .datum({type: 'Sphere'})
                .attr('class', 'background')
                .attr('d', path);

            g.append('path')
              .datum(graticule)
              .attr('class', 'graticule')
              .attr('d', path);
        }

        var self = this;

        zoom = d3.geo.zoom()
          .projection(projection)
          .scaleExtent([projection.scale() * 0.7, projection.scale() * 8])
          .on('zoom.redraw', function(){

            d3.event.sourceEvent.preventDefault();
            self.svg.selectAll('path').attr('d',path);
          });


        // Perform an synchronous request to load JSON
        $.ajax({
          url: mapType[type].base,
          async: false,
          dataType: 'json',
          success: function (topology) {

            self.paths = g.selectAll("path")
              .data(topojson.feature(topology, topology.objects[mapType[type].mapKey]).features)
              .enter()
             .append('g')
              .append("path")
              .attr('class', 'land')
              .attr('data-name', function(d) {
                return d.properties.name;
              })
              .attr('data-id', function(d) {
                return d.id;
              })
              .attr("d", path)
          }
        });

        this.svg.selectAll('path').call(zoom);

        return this;
    }

    this.addColor = function(){
          //TODO: Add series for coloring
          this.paths.style("fill", function(d) { return colorScale(dataByUnits.get(d.properties.name))})

          return this;
    }


    this.addTooltip = function() {
          var tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

          this.paths
            .on("mouseover", function(d){

                tooltip
                    .transition()
                    .duration(50)
                    .style("opacity", 1)

                //TODO: Customized tooltip
                tooltip
                    .text(d.properties.name + ": " + dataByUnits.get(d.properties.name) )
                    .style("left", (d3.event.pageX) + "px"  )
                    .style("top", (d3.event.pageY -30) + "px")
                    .attr('class', 'tooltip text')
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

    this.drawLegend = function(height, position) {

        //TODO: Make legend more progressive. Now it only has lowest and highest value.

        this.legend = this.svg.append("g")
            .attr("class","legend")
            .attr("transform", "translate(" + position.x + "," + position.y + ")")
            .selectAll("g")
            .data(colorDomain)
            .enter().append("g");

        var ls_w = 20, ls_h = 20;

        this.legend.append("rect")
          .attr("x", 20)
          .attr("y", function(d, i){ return height - (i*ls_h) - 2*ls_h;})
          .attr("width", ls_w)
          .attr("height", ls_h)
          .style("fill", function(d, i) { return colorScale(d); })
          .style("opacity", 0.8);

        this.legend.append("text")
          .attr("x", 50)
          .attr("y", function(d, i){ return height - (i*ls_h) - ls_h - 4;})
          .text(function(d, i){ return colorDomain[i]; })


        return this;
    }

    //TODO: Not using it at the moment.
    this.addLayer = function(type, data) {

         circles = this.svg.selectAll("circle")
            .data(dataByUnits).enter()
            .append("circle")
            .attr("class","circle")
            .attr("id", function (d) { return d.origin;})
            .attr("cx", function (d) { return projection([d.long, d.lat])[0]; })
            .attr("cy", function (d) { return projection([d.long, d.lat])[1]; })
            .attr("r", function (d) {  return Math.log(d.flightCounts); })
            .attr("fill", "#1f77b4")
            .attr('opacity', opacityCircle)
        return this
    }




    this.svg = this.drawCanvas();

    if (type == "orthographic") {
       this.svg.attr('viewBox', '0, 0, ' + width + ', ' + height)
    }

    return this;

}

MapBuilder.prototype = Object.create(ChartBuilder.prototype);
MapBuilder.prototype.constructor = MapBuilder;
MapBuilder.prototype.parent = ChartBuilder.prototype;

function drawMapChart(data, options) {

    var canvasWidth = options.canvas_width || 960
    , canvasHeight = options.canvas_height || 400
    , margin = {}
    margin.left = options.margin_left || 80
    margin.right = options.margin_right || 65
    margin.top = options.margin_top ||40
    margin.bottom = options.margin_bottom || 60

    var chartId = "#" + options._id

    var width = options.width || canvasWidth - margin.left - margin.right
    , height = options.height || canvasHeight- margin.top - margin.bottom

    var mapType = options.map_type || "world"
    var geoUnitColumn = options.geo_unit_column
    var geoValueColumn = options.geo_value_column

    var legendX = options.legend_x || 0
    , legendY = options.legend_y || margin.top
    , legendHeight = options.legend_height || 70

    console.log(mapType)
    var chart = new MapBuilder(chartId, data, mapType ,canvasWidth, canvasHeight,
                                width, height, margin, geoUnitColumn, geoValueColumn)
        .drawMap(data, [0,0], 150, [0,0], 'land')


    if (data != null) {
        chart
            .addColor()
            .addTooltip()
            .drawLegend(legendHeight, {x: legendX, y:legendY})

    }
}

return {
    LineChart: drawLineChart,
    MapChart: drawMapChart
};

})();