var pyd3 = pyd3 || {};

pyd3.LineChart = (function() {

LineChartBuilder = function(id, width, height, margin, x_serie, y_series, xScale, yScale, colorSet = d3.scale.category10()) {
    var seriesCount = y_series.length;
    var formatDate = d3.time.format("%Y-%m-%d");

    var drawCanvas = function() {
        return d3
            .select(id)
            .append("svg")
                .style("max-width", "960px")
                .attr("width", width)
                .attr("height", height)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    }

    this.drawGridLine = function() {
        // Draw the left y Grid lines
        svg.append("g")
          .attr("class", "grid")
          .call(axisBuilder.make(yScale, "left", 5)
                  .tickSize(-width, 0, 0)
                  .tickFormat("")
               )
         return this;
    }

    this.drawTitle = function(x, y, title) {
        svg
            .append("text")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("class", 'chart-title')
                .text(title);

        return this;
    }

    this.drawXAxis = function(xAxis, axisPosition, titlePosition, title) {
        svg
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


    this.drawYAxis = function(yAxis, titlePosition, title ) {
        svg.append("g")
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


    this.drawLine = function(dataGrouped) {
        var line = d3.svg.line()
            .interpolate('cardinal')
            .x(function(d) { return xScale(d[x_serie]); })
            .y(function(d) { return yScale(d[d.id]); });

        //Update svg
        var multiLines = svg
            .selectAll(".line-g")
            .data(dataGrouped)

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

    //Loop though all filters and check data against filters. Once done, update svg.
    this.updateData = function(select, filterDict, nestData, data, xAxis) {

        //jQuery thing to return name and values.
        var name = select.attr("name")
        , valueSelected = select.val()

        filterDict[name] = function(d) {

            var value = d[name];

            if (!value) return true;

            if (value instanceof Date) value=formatDate(value);

            return valueSelected.indexOf(value.toString()) > -1;
        };


        filterData = nestData(data) ;

        for (f in filterDict) {

            filterData = filterData.map(function(c) {
                return c.filter(filterDict[f]);
            })

        }

        var t = svg.transition().duration(350);
        t.select(".x.axis").call(xAxis);
        drawLine(filterData);

        //updateFocusCircle(filterData);
        return this;
    };

    this.drawLegend = function(height, position, legendTick, circleRadius) {
        this.legendHeight = height;

        this.legend = svg.append("g")
            .attr("class","legend")
            .attr("transform", "translate(" + position.x + "," + position.y + ")")
            .selectAll("g")
            .data(d3.range(seriesCount))
            .enter().append("g");

        if (legendTick == 'circle') {
            drawCircleTicks();
        } else {
            drawRectTicks();
        };

        colorTicks();
        drawLabel();

        return this;
    }

    var drawCircleTicks = function() {
        return legend.append("circle")
                .attr("class", "legend tick")
                .attr("cx", function(d) { return margin.right / 4;})
                .attr("cy", function(d) { return d*(legendHeight/seriesCount); })
                .attr("r", function (d) { return circleRadius; })

    }

    var drawRectTicks = function(){

        return legend.append("rect")
                .attr("class", "legend tick")
                .attr('x', function(d) { return margin.right/5; })
                .attr('y', function(d) { return Math.floor(d*legendHeight/seriesCount); })
                .attr("width", 10)
                .attr("height", Math.floor(legendHeight/seriesCount) )

    }

    var colorTicks = function() {
        return legend.selectAll('.legend.tick')
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


    var drawLabel = function(){

        return legend.append('text')
                .attr("y", function (d) { return (d+0.5)*(legendHeight/seriesCount); })
                .attr("x", function (d) { return  margin.right/3;})
                .attr("fill", function (d) {return colorSet(d); })
                .attr("text-anchor", "start")
                .on("click", function(d) {
                    toggleId('line-'+d);
                    toggleId('focus-'+d)
                    toggleId('legend-tick-'+d)
                })
                .text(function(d) {return y_series[d]})

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
    var drawFocusCircle = function() {
        var focus = svg.selectAll(".focus")
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

    var changeFocusCircleState = function(state) {
        svg.selectAll(".focus")
           .style("display", state);
    };


    var mouseMoveFocusCircle = function(data, element){
        var bisectDate = d3.bisector(function(d) { return d[x_serie]; }).left;

        var x0 = xScale.invert(d3.mouse(element)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0[x_serie] > d1[x_serie] - x0 ? d1 : d0;

        svg.selectAll(".focus")
            .attr("transform", function(i) { return "translate(" + xScale(d[x_serie])  + ","
                   + yScale(d['Series ' + (i + 1)]) + ")";})
            .select("text")
                .text(function(i) { return formatDate(d[x_serie]) + ": "+ d['Series ' + (i + 1)]; })
                .style('fill', function(i) { return colorSet(i % 10); })
                .style('font-size', '10px');
    };


    this.updateFocusCircle = function(data, width, height) {
        drawFocusCircle();
        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() {changeFocusCircleState(null);})
            .on("mouseout", function() {changeFocusCircleState('none');})
            .on("mousemove", function() {mouseMoveFocusCircle(data, this)})

        return this;
    };

    this.svg = drawCanvas();

    return this;
}



var scaleBuilder = {}

scaleBuilder.timeScale = function(range, domain) {
    return d3.time.scale()
        .range(range)
        .domain(domain);
}

scaleBuilder.linearScale = function(range, domain) {
    return d3.scale.linear()
        .range(range)
        .domain(domain);

}

var axisBuilder = {}

axisBuilder.make = function(scale, orientation, ticks) {
    var axis = d3.svg.axis()
        .scale(scale)
        .orient(orientation);

    if (ticks) axis.ticks(ticks);

    return axis;
}



var drawChart = function(data, options, filters) {

    //*** Init attributes *** //
    var x_serie =  options.x_serie
    , y_series = options.y_series
    , filterSeries = options.filter_series
    , chart_title = options.chart_title || ""
    , x_axis_title = options.x_axis_title || ""
    , y_axis_title = options.y_axis_title || ""
    , second_y_axis = options.second_y_axis || false
    , second_y_axis_title = options.second_y_axis_title || ""

    var canvas_width = options.canvas_width || 960
    , canvas_height = options.canvas_height || 400
    , margin = {}
    margin.left = options.margin_left || 80
    margin.right = options.margin_right || 65
    margin.top = options.margin_top ||40
    margin.bottom = options.margin_bottom || 60

    var width = options.width || canvas_width - margin.left - margin.right
    , height = options.height || canvas_height - margin.top - margin.bottom
    , legendTick = options.legend_tick || "rect"
    , legendStyle = options.legend_style || "expand"
    , legend_x = options.legend_x || width
    , legend_y = options.legend_y || margin.top
    , circleRadius= options.circleRadius || 5


    var parseDate = d3.time.format('%Y-%m-%d').parse;

    data.forEach(function(d) {

         d[x_serie] = parseDate(d[x_serie])
         y_series.forEach(function(item, index){
            d[item] = +d[item];
          })

    });

    //sort data by date
    data.sort(function(a, b) {
      return a.x_serie - b.x_serie;
    })

    filterDict = {};

    for (var f in filters) {

        var f_slugify = f.replace(' ', '-').toLowerCase();

        $("#filter-"+f_slugify).multiselect({
            enableCaseInsensitiveFiltering: true,
            includeSelectAllOption: true,
            //Bootstrap thing. Have to define update functions for all three events.
            onChange: function(option, checked) { chart.updateData(this.$select, filterDict, nestData, data, xAxis);},
            onSelectAll: function(checked) { chart.updateData(this.$select, filterDict, nestData, data, xAxis); },
            onDeselectAll: function(checked) { cart.updateData(this.$select, filterDict, nestData, data, xAxis); }
        })

    }


    //define axis
    var xScale = scaleBuilder.timeScale([0, width - margin.right / 2], d3.extent(data, function(d) { return d.Date; }));

    var xAxis = axisBuilder.make(xScale, "bottom");

    var nestData = function(data) {
        return y_series.map(function(e) {
            return data.map(function(d) {
                var value = {};
                value['id'] = e;
                value[x_serie] = d[x_serie];
                value[e] = +d[e];
                return value;
            })

        })
    }

    var dataGrouped = nestData(data);

    // Find min and max of y series.
    var yAxisMax = d3.max(dataGrouped, function(c) {
        return d3.max(c, function(v) {return v[v.id]; })
        //same as return d3.max(c.values.map(function(d) {return d.value;} ));
    } );

    var yScale = scaleBuilder.linearScale([height, margin.top],[0, yAxisMax] );

    var yAxis = axisBuilder.make(yScale, "left", data.length);

    var chart = LineChartBuilder('#chart1', canvas_width, canvas_height, margin, x_serie, y_series, xScale, yScale)
        .drawTitle(width / 2, margin.top / 2, chart_title)
        .drawXAxis(xAxis, axisPosition={x: 0, y: height},
                    titlePosition={x: width/2, y: margin.bottom/2}, x_axis_title)
        .drawYAxis(yAxis, {x:-height/2, y:-margin.left/2}, y_axis_title)
        .drawLine(dataGrouped)
        .drawLegend(height, {x: legend_x, y: legend_y}, legendTick, circleRadius)
        .drawGridLine()
        .updateFocusCircle(data, width, height);
}

return drawChart;

})();