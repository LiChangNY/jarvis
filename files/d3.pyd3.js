(function() {

 twoAxesLineChart = function(data) {
    var margin = {top: 20, right: 65, bottom: 40, left: 80};
    var width = 960 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    
    var svg = d3.select("#chart1")
              .append("svg")
                  //.style("position", "relative")
                  .style("max-width", "960px")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
              .append("g")
                  .attr("transform", 
                        "translate(" + margin.left + "," + margin.top + ")"); 
   
  var parseDate = d3.time.format('%Y-%m-%d').parse,
      bisectDate = d3.bisector(function(d) { return d.Date; }).left,
      formatDate = d3.time.format("%m-%d");;  
      
    data.forEach(function(d) {
      d['Date'] = parseDate(d['Date']);
      d['Series 1'] = +d['Series 1'];
      d['Series 2'] = +d['Series 2'];
    });
      
    //sort data by date  
    data.sort(function(a, b) {
      return a.Date - b.Date;
    });
      
    var xScale = d3.time.scale()
       .range([0, width- margin.right/2])
       .domain([data[0]['Date'], data[data.length - 1]['Date']]) ;   
  
    var y1Max = Math.round(
        d3.max(data, function(d){return d['Series 1'];})/5) * 5;
    var y2Max = Math.round(
        d3.max(data, function(d) {return d["Series 2"];})/5)*5 ;

    var yScale = d3.scale.linear()
        .range([height, margin.top])
        .domain([0, y1Max]); 
    var yScale2 = d3.scale.linear()
        .range([height, margin.top])
    // co-erce the max y2 value to be a multiple of y1Max
        .domain([0, Math.ceil(y2Max/y1Max)*y1Max]);  

    //define axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")

    var tickerBase = [0,1,2,3,4,5];
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)

    var yAxis2 = d3.svg.axis()
        .scale(yScale2)
        .orient("right")
        //coerce the tick values
        .tickValues(
            tickerBase.map(function(x) {
                return x * Math.ceil(y2Max/y1Max)*y1Max/5
            }));       

    function make_y_axis() {
        return d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(5)
      }

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
            .text('Date');

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
        .text('Series 1');

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
            .text('Series 2');

    // draw the left y Grid lines
      svg.append("g")            
          .attr("class", "grid")
          .call(make_y_axis()
              .tickSize(-width, 0, 0)
              .tickFormat(""))

    // Add the title
      svg.append("text")
          .attr("x", (width / 2))     
          .attr("y", -margin.top/6)
          .attr("text-anchor", "middle")
          .attr("class", 'chart-title')
          .text('Title goes here');

    // define line   
    var drawLine = d3.svg.line().interpolate('cardinal')
            .x(function(d) { 
                return xScale(d['Date']) ; }) 
            .y(function(d) { 
                return yScale(d["Series 1"]);});

    svg.append("path")
       .datum(data)
       .attr("class", "line")
       .attr("d", drawLine);

    var drawLine2 = d3.svg.line().interpolate('cardinal')
            .x(function(d) { 
                return xScale(d['Date']) ; })
            .y(function(d) { 
                return yScale2(d["Series 2"]);});       
    svg.append("path")
       .datum(data)
       .attr("class", "line")
       .style('stroke', 'orange')
       .attr("d", drawLine2);

    //draw focus circle
    var focus = svg.append("g")
        .attr("class", "focus")
        .style('stroke', 'steelblue')
        .style("display", "none");

    focus.append("circle")
        .attr("r", 4.5);

    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    var focus2 = svg.append("g")
        .attr("class", "focus")
        .style('stroke', 'orange')
        .style("display", "none");

    focus2.append("circle")
        .attr("r", 4.5);

    focus2.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");  

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { 
            focus.style("display", null); 
            focus2.style("display", null); })
        .on("mouseout", function() { 
            focus.style("display", "none"); 
            focus2.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
        
       var x0 = xScale.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0['Date'] > d1['Date'] - x0 ? d1 : d0;

        focus.attr("transform", 
                   "translate(" + xScale(d['Date'])  + "," 
                   + yScale(d["Series 1"]) + ")");
        focus.select("text")
            .text(formatDate(d['Date']) + ": "+ d["Series 1"])
            .style('fill', 'steelblue')
            .style('font-size', '10px');
          
          
        focus2.attr("transform", 
                    "translate(" + xScale(d['Date'])  + ","
                    + yScale2(d["Series 2"]) + ")");
        focus2.select("text")
            .text(formatDate(d['Date']) + ": "+ d["Series 2"])
                .style('fill', 'orange')
                .style('font-size', '10px');  

    }
	}

})();