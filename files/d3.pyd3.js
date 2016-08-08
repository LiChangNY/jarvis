var pyd3 = pyd3 || {};

pyd3.drawChart = (function() {

var chartBuilder = {}

chartBuilder.drawCanvas = function(id, width, height, position) {
    return d3
        .select(id)
            .append("svg")
            .style("max-width", "960px")
            .attr("width", width)
            .attr("height", height)
        .append("g")
            .attr("transform", "translate(" + position.x + "," + position.y + ")");
}

chartBuilder.drawTitle = function(svg, x, y, title) {
    return svg
        .append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .attr("class", 'chart-title')
            .text(title);
}

chartBuilder.drawXAxis = function(svg, xAxis, axisPosition, titlePosition, title) {
    return svg
        .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + axisPosition.x + ", " + axisPosition.y + ")")
            .call(xAxis)
        .append("text")
            .attr("transform", "translate(" + titlePosition.x + " ," + titlePosition.y + ")")
            .style("text-anchor", "middle")
            .text(title);
}


chartBuilder.drawYAxis = function(svg, yAxis, titlePosition, title ) {
    return svg.append("g")
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
}

var legendBuilder = {};

legendBuilder.drawLegend = function(svg, position, value) {
    var legend = svg.append("g")
        .attr("class","legend")
        .attr("transform", "translate(" + position.x + "," + position.y + ")")
        .selectAll("g")
        .data(value)
        .enter().append("g");

    return legend;
}

legendBuilder.drawCircleTicks = function(legend, cx, cy, r){
    return legend.append("circle")
            .attr("class", "legend tick")
            .attr("cx", function(d) {return cx;})
            .attr("cy", function(d) {return cy; })
            .attr("r", function (d) { return r; })

}

legendBuilder.drawRectTicks = function(legend, x, y, w, h){

    return legend.append("rect")
            .attr("class", "legend tick")
            .attr('x', function(d) { return x; })
            .attr('y', function(d) {return y; })
            .attr("width", w)
            .attr("height", h )

}

legendBuilder.colorTicks = function(legend, colorSet) {
    return legend.selectAll('.legend.tick')
           .attr("id", function(d) {return "legend-tick-" + d; })
           .style("fill", function(d) {return colorSet(d % colorSet.length);})
           .style('stroke', function(d) {return colorSet(d % colorSet.length);})
           .style('stroke-opacity',0.3)
            .on("click", function(d) {
                toggleId('line-'+d);
                toggleId('focus-'+d)
                toggleId('legend-tick-'+d)
            })
}


legendBuilder.drawLabel = function(legend, x, y, colorSet, labels){

    return legend.append('text')
            .attr("y", function (d) { return y; })
            .attr("x", function (d) { return  x;})
            .attr("fill", function (d) {return c10(d); })
            .attr("text-anchor", "start")
            .on("click", function(d) {
                toggleId('line-'+d);
                toggleId('focus-'+d)
                toggleId('legend-tick-'+d)
            })
            .text(function(d) {return labels[d]})

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

    filterDict = {};

    for (var f in filters) {

        var f_slugify = f.replace(' ', '-').toLowerCase();

        $("#filter-"+f_slugify).multiselect({
            enableCaseInsensitiveFiltering: true,
            includeSelectAllOption: true,
            //Bootstrap thing. Have to define update functions for all three events.
            onChange: function(option, checked) { updateData(this.$select);},
            onSelectAll: function(checked) { updateData(this.$select); },
            onDeselectAll: function(checked) { updateData(this.$select); }
        })

    }


    //Loop though all filters and check data against filters. Once done, update svg.
    updateData = function(select) {

        //jQuery thing to return name and values.
        var name = select.attr("name")
        , valueSelected = select.val()

        filterDict[name] = function(d) {
            var value = d[name]

            if (value instanceof Date) { value=formatDate(value)} //convert date object to be same as the filter format

            return valueSelected.indexOf(value.toString()) > -1;
        };

        filterData = data;
        for (f in filterDict) {
            filterData = filterData.filter(filterDict[f]);
        }


        var t = svg.transition().duration(350);
        t.select(".x.axis").call(xAxis);
        y_series.forEach(function( serieName, serieNo) {
            window['line-'+serieNo] = line(filterData, serieName, serieNo);
            t.select('#line-'+serieNo).attr("d", window['line-'+serieNo]); //Ideal way of doing update. But it's bound to data.
        });

        updateFocusCircle(filterData);

    };


    //*** Init attributes *** //
    var x_serie =  options.x_serie
    , y_series = options.y_series
    , filterSeries = options.filter_series
    , chart_title = options.chart_title || ""
    , x_axis_title = options.x_axis_title || ""
    , y_axis_title = options.y_axis_title || ""
    , second_y_axis = options.second_y_axis || false
    , second_y_axis_title = options.second_y_axis_title || ""
    , legendTick = options.legend_tick || "rect"
    , legendStyle = options.legend_style || "expand"
    , legend_x = options.legend_x || width
    , legend_y = options.legend_y || margin.top
    , circleRadius= options.circleRadius || 5

    var canvas_width = options.canvas_width || 960
    , canvas_height = options.canvas_height || 400
    , margin = {}
    margin.left = options.margin_left || 80
    margin.right = options.margin_right || 65
    margin.top = options.margin_top ||40
    margin.bottom = options.margin_bottom || 60

    var width = options.width || canvas_width - margin.left - margin.right
    , height = options.height || canvas_height - margin.top - margin.bottom

    var svg = chartBuilder.drawCanvas('#chart1', canvas_width, canvas_height, {x: margin.left , y: margin.top} )

    var parseDate = d3.time.format('%Y-%m-%d').parse,
      bisectDate = d3.bisector(function(d) { return d[x_serie]; }).left,
      formatDate = d3.time.format("%Y-%m-%d");

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

    updateChart = function(data) {}

    //define axis
    var xScale = scaleBuilder.timeScale([0, width - margin.right / 2], d3.extent(data, function(d) { return d.Date; }));

    var xAxis = axisBuilder.make(xScale, "bottom");

    chartBuilder.drawXAxis(svg, xAxis, axisPosition={x: 0, y: height},
                            titlePosition={x: width/2, y: margin.bottom/2}, x_axis_title);

    chartBuilder.drawTitle(svg, width / 2, margin.top / 2, chart_title);

    // find the max of all series on the same axis.
    var y_series_max =  d3.max(data, function(d){return d[y_series[0]];})
    , y_series_min = d3.min(data, function(d){return d[y_series[0]];})

    y_series.forEach(function(e, i){
        var y_serie_max = d3.max(data, function(d){return d[e];});
        y_series_max = (y_series_max > y_serie_max)? y_series_max: y_serie_max;

        var y_serie_min = d3.min(data, function(d){return d[e];});
        y_series_min = (y_series_min < y_serie_min)? y_series_min: y_serie_min;

    })


    var yScale = scaleBuilder.linearScale([height, margin.top],[0, y_series_max] );

    var yAxis = axisBuilder.make(yScale, "left", data.length);

    chartBuilder.drawYAxis(svg, yAxis, {x:-height/2, y:-margin.left/2}, y_axis_title);

    // Draw the left y Grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(axisBuilder.make(yScale, "left", 5)
              .tickSize(-width, 0, 0)
              .tickFormat("")
           )

    //*** Set up shapes *** //
    var c10 = d3.scale.category10();

    // Draw line element
    line = function(data, serieName, serieNo) {

        //If data has value, re-scale xScale; otherwise, use the default scale.
        if (data && data.length > 0) {
            xScale.domain(d3.extent(data, function(d) { return d.Date; })) ;
        }

        window['line-'+serieNo] = d3.svg.line().interpolate('cardinal')
            .x(function(d) {
                return xScale(d[x_serie]) ; })
            .y(function(d) {
                return yScale(d[serieName]);});

        //TODO: This is kinda hacky way of updating chart. See if I can replace transition.
        //All I need here is to update data without further drawing new path element.
        $('#line-'+serieNo).remove();

        //TODO: Replace datum() with Enter, Update, Exit
        svg.append('path')
            .datum(data)
            .attr("class", "line")
            .attr('stroke', c10(serieNo % 10)) //Take remainder
            .attr("d", window['line-'+serieNo])
            .attr("id", 'line-'+serieNo);

        return window['line-'+serieNo];

    };

    console.log(data);
    y_series.forEach(function(serieName, serieNo) {
        window['line-'+serieNo] = line(data, serieName, serieNo);
    });



    //Draw focus circle
    drawFocusCircle = function(serieName, serieNo) {
        var focus = svg.append("g")
            .attr("class", "focus")
            .style('stroke', c10(serieNo % 10))
            .style("display", "none")
            .attr('id', 'focus-'+serieNo)

         focus.append("circle")
            .attr("r", 4.5)

         focus.append("text")
            .attr("x", 9)
            .attr("dy", ".35em");

        window['focus-' + serieNo] = focus;

    };

    changeFocusCircleState = function(state) {
       y_series.forEach( function(serieName, serieNo) {
            window['focus-'+serieNo].style("display", state);
       })
    };


    mouseMoveFocusCircle = function(data, element) {

        var x0 = xScale.invert(d3.mouse(element)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0[x_serie] > d1[x_serie] - x0 ? d1 : d0;


        y_series.forEach( function(serieName, serieNo){
            window['focus-'+serieNo].attr("transform", "translate(" + xScale(d[x_serie])  + ","
                   + yScale(d[serieName]) + ")");
            window['focus-'+serieNo].select("text")
                .text(formatDate(d[x_serie]) + ": "+ d[serieName])
                .style('fill', c10(serieNo % 10))
                .style('font-size', '10px');

        });

    };


    updateFocusCircle = function(data) {

        y_series.forEach(function(serieName, serieNo) {

            drawFocusCircle(serieName,serieNo);

        });

        if (data && data.length > 0) {
          svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            //Why can't we just call changeFocusCircleState(state) but function()
            .on("mouseover", function() {changeFocusCircleState(null);})
            .on("mouseout", function() {changeFocusCircleState('none');})
            .on("mousemove", function() {mouseMoveFocusCircle(data, this)})

        } else {

            y_series.forEach(function(serieName, serieNo) {

                window['focus-'+serieNo].remove();
            });

        }


    };

    updateFocusCircle(data);

    legend = chartBuilder.drawLegend(svg, {x: legend_x, y: legend_y}, d3.range(y_series.length))
    if (legendTick == 'circle') {
        legendBuilder.drawCircleTicks(legend,
                                       margin.right/4 ,
                                       d*(height/y_series.length),
                                       circleRadius)
    } else {
        legendBuilder.drawRectTicks(legend, margin.right/5, Math.floor(d*(height)/y_series.length),
                                10, Math.floor(height/y_series.length))
    };

    legendBuilder.colorTicks(legend, c10);
    legendBuilder.drawLabel(legend, margin.right/3, (d+0.5)*(height/y_series.length), c10, y_series)

    toggleId = function(shape_id) {
        //Need to add [0] to access the attributes
        var active  = $("#"+shape_id)[0].active ? false : true
		, newOpacity = active ? 0 : 1;

		// Hide or show the elements
		d3.select("#"+shape_id).style("opacity", newOpacity);

		// Update whether or not the elements are active
		$("#"+shape_id)[0].active = active;
		//console.log($("#"+shape_id)[0].active);

    }


}

return drawChart;

})();