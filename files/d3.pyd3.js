(function() {


drawXAxis = function() {}

create_svg = function() {} // make this private?

drawLegend = function() {}

//Draw y axis
drawYAxis =  function() {
    return d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
}

// Draw line element
drawLine = function(serieName, serieNo) {

    //TODO use d3 color palette
    colors = ['steelblue', 'orange', 'red', 'green', 'yellow']

    this['line_'+serieNo] = d3.svg.line().interpolate('cardinal')
    .x(function(d) {
        return xScale(d[x_serie]) ; })
    .y(function(d) {
        return yScale(d[serieName]);});

    svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr('stroke', colors[serieNo])
    .attr("d", this['line_'+serieNo]);


};

//Draw focus circle
drawFocusCircle = function(serieName, serieNo) {
    var focus = svg.append("g")
        .attr("class", "focus")
        .style('stroke', colors[serieNo])
        .style("display", "none")

     focus.append("circle")
        .attr("r", 4.5)

     focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    window['focus_' + serieNo] = focus;

}

changeFocusCircleState = function(state) {
   y_series.forEach( function(serieName, serieNo) {
        window['focus_'+serieNo].style("display", state);
   })
};


mouseMoveFocusCircle = function() {

    var x0 = xScale.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0[x_serie] > d1[x_serie] - x0 ? d1 : d0;


    y_series.forEach( function(serieName, serieNo){
        window['focus_'+serieNo].attr("transform", "translate(" + xScale(d[x_serie])  + ","
               + yScale(d[serieName]) + ")");
        window['focus_'+serieNo].select("text")
            .text(formatDate(d[x_serie]) + ": "+ d[serieName])
            .style('fill', colors[serieNo])
            .style('font-size', '10px');

    });

}



drawChart = function(data, options) {

    var chart_title = options.chart_title || ""
    , x_axis_title = options.x_axis_title || ""
    , y_axis_title = options.y_axis_title || ""
    , second_y_axis = options.second_y_axis || false
    , second_y_axis_title = options.second_y_axis_title || ""
    , x_serie =  options.x_serie
    , y_series = options.y_series

    var margin = {}
    margin.left = options.margin_left || 80
    margin.right = options.margin_right || 65
    margin.top = options.margin_top ||20
    margin.bottom = options.margin_bottom || 40

    var width = options.width || 960 - margin.left - margin.right
    , height = options.height || 400 - margin.top - margin.bottom

    var svg = d3.select("#chart1")
              .append("svg")
                  .style("max-width", "960px")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
              .append("g")
                  .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

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
    }

    var xScale = d3.time.scale()
       .range([0, width- margin.right/2])
       .domain([data[0][x_serie], data[data.length - 1][x_serie]]) ;

    // find the max of all series on the same axis.
    var y_series_max =  d3.max(data, function(d){return d[y_series[0]];})

    y_series.forEach(function(item, index){
        var y_serie_max = d3.max(data, function(d){return d[item];});
        y_series_max = (y_series_max > y_serie_max)? y_series_max: y_serie_max;

    })

    //define axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")

    var tickerBase = [0,1,2,3,4,5];

    var yScale = d3.scale.linear()
        .range([height, margin.top])
        .domain([0, y_series_max]);

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)

    //draw the x axis
     svg.append("g")
            .attr("class", "x axis")
            .attr("transform",
                  "translate(0," + height + ")")
            .call(xAxis)
        .append("text")
            .attr("transform",
                  "translate(" + (width/2) + " ," + margin.bottom + ")")
            .style("text-anchor", "middle")
            .text(x_axis_title);

    //draw the left y axis
     svg.append("g")
        .attr("class", "y axis")
        .style('fill', 'steelblue')
        .call(yAxis)
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.bottom)
        .attr("x", -width/4)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .text(y_axis_title);


    if (second_y_axis){
        var yScale2 = d3.scale.linear()
                        .range([height, margin.top])
                        .domain([0, y_series_max]);

        var yAxis2 = d3.svg.axis()
                        .scale(yScale2)
                        .orient("right")
                        //coerce the tick values
                        .tickValues(
                            tickerBase
                            //tickerBase.map(function(x) {
                            //    return x * Math.ceil(y2Max/y1Max)*y1Max/5
                            //}
                        );


        //draw the right y axis
        svg.append("g")
          .attr("class", "y axis")
          .style('fill','orange')
          .attr("transform", "translate(" + width + " ,0)")
          .call(yAxis2)
         .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.bottom*1.25)
            .attr("x", -width/4)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .text(second_y_axis_title);
    }

    // draw the left y Grid lines
      svg.append("g")
          .attr("class", "grid")
          .call(drawYAxis()
              .tickSize(-width, 0, 0)
              .tickFormat(""))

    // Add  title
     svg.append("text")
          .attr("x", (width / 2))
          .attr("y", -margin.top/6)
          .attr("text-anchor", "middle")
          .attr("class", 'chart-title')
          .text(chart_title);

    y_series.forEach(function(serieName, serieNo) {
            drawLine(serieName, serieNo);
        });
    y_series.forEach(function(serieName, serieNo) {
            drawFocusCircle(serieName,serieNo);
        });


    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {changeFocusCircleState(null);})
        .on("mouseout", function() {changeFocusCircleState('none');})
        .on("mousemove", mouseMoveFocusCircle);


}


})();