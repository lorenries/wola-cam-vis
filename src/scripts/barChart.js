import addCommas from './addCommas.js';
import fillColor from './fillColor.js'
import d3Tip from 'd3-tip';
d3.tip = d3Tip;

function barChart(data) {

  var margin = {top: 5, right: 5, bottom: 50, left: 80};
  // here, we want the full chart to be 700x200, so we determine
  // the width and height by subtracting the margins from those values
  var fullWidth = 900;
  var fullHeight = 500;
  // the width and height values will be used in the ranges of our scales
  var width = fullWidth - margin.right - margin.left;
  var height = fullHeight - margin.top - margin.bottom;

  var svg = d3.select('#bar-chart')
  .append('svg')
  .attr('viewBox', '0 0 ' + fullWidth + ' ' + fullHeight)
  .append('g')
      // translate it to leave room for the left and top margins
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var barHolder = svg.append('g')
    .classed('bar-holder', true);

  var chartState = {
    country: 'all-countries',
    year: 'all-years'
  }

  var years = allYears();

  function allYears() {
    var set = new Set();
    data.forEach(function(val) { set.add(val.year )});
    return Array.from(set).sort(function(a,b) { return a - b });
  }

  function nestData(country, year) {

    function total(valueArray) {

      if (country === 'all-countries') {
        country = false;
      } 

      if (year === 'all-years') {
        year = false;
      }

      return valueArray.filter(function(val) { return country && !year ? val.country === country : year && !country ? +val.year === +year : country && year ? val.country === country && +val.year === +year : true }).reduce(function(acc,cur) { return acc + cur.total }, 0);
    }

    var filtered = d3.nest()
      .key(function(d) { return d.category; })
      .entries(data)
      .map(function(currentValue) {
        return {
          key: currentValue.key,
          total: total(currentValue.values)
        }
      });

    return filtered;
  } 

  function setupButtons() {

      d3.select('#countries-toolbar')
      .selectAll('.button')
      .on('click', function () {
          d3.event.preventDefault();
          // Remove active class from all buttons
          d3.selectAll('#countries-toolbar .button').classed('active', false);
          // Find the button just clicked
          var button = d3.select(this);
          // Set it as the active button
          button.classed('active', true);
          // Get the id of the button
          var buttonId = button.attr('id');
          chartState.country = buttonId;
          // Toggle the bubble chart based on
          // the currently clicked button.
          updateChart(chartState.country, chartState.year);

      });

      d3.select('#years-toolbar')
        .selectAll('.year')
        .data(years)
        .enter().append('a')
        .attr('href', '#')
        .attr('id', function(d) { return d; })
        .classed('year button', true)
        .text(function(d) { return d; });

      d3.select('#years-toolbar')
        .selectAll('.button')
        .on('click', function () {
            d3.event.preventDefault();
            // Remove active class from all buttons
            d3.selectAll('#years-toolbar .button').classed('active', false);
            // Find the button just clicked
            var button = d3.select(this);
            // Set it as the active button
            button.classed('active', true);
            // Get the id of the button
            var buttonId = button.attr('id');
            chartState.year = buttonId;
            // Toggle the bubble chart based on
            // the currently clicked button.
            updateChart(chartState.country, chartState.year);
        });

        updateChart();
  }

  function updateChart(country, year) {

    var initializedData = nestData(country, year);
    var max = d3.max(nestData("all-countries", "all-years").map(function(val) { return val.total }));
    var categories = initializedData.map(function(val) { return val.key });

    var xScale = d3.scaleBand()
      .domain(categories)
      .range([0, width])
      .paddingInner(0.25);

    var bandwidth = xScale.bandwidth();

    var yScale = d3.scaleLinear()
      .domain([0, max])
      .range([height, 0]);

      var formatValue = d3.format(".0s");

      var xAxis = d3.axisBottom(xScale);
      var yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(function(d) { return "$" + formatValue(d) });

      // draw the axes
      svg.append('g')
        .classed('x axis', true)
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

      var yAxisEle = svg.append('g')
        .classed('y axis', true)
        .call(yAxis)
        .attr('transform', 'translate(-15, 0)');

      // add a label to the yAxis
      var yText = yAxisEle.append('text')
        .attr('transform', 'rotate(-90)translate(-' + height/2 + ',0)')
        .style('text-anchor', 'middle')
        .style('fill', 'black')
        .attr('dy', '-2.5em')
        .style('font-size', 14)
        .text('Total');

    const tooltip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) { return `$${addCommas(d.total)}` });

    svg.call(tooltip);

    barHolder.selectAll('rect.bar')
        .data(initializedData)
        .transition().duration(250)
        .attr('y', function(d) {
          // the y position is determined by the datum's temp
          // this value is the top edge of the rectangle
          return yScale(d.total);
        })
        .attr('height', function(d) {
          // the bar's height should align it with the base of the chart (y=0)
          return height - yScale(d.total);
        });

    barHolder.selectAll('rect.bar')
        .data(initializedData)
        .enter().append('rect')
        .classed('bar', true)
        .attr('x', function(d, i) {
          // the x value is determined using the
          // month of the datum
          return xScale(d.key);
        })
        .attr('width', bandwidth)
        .attr('y', function(d) {
          // the y position is determined by the datum's temp
          // this value is the top edge of the rectangle
          return yScale(d.total);
        })
        .attr('height', function(d) {
          // the bar's height should align it with the base of the chart (y=0)
          return height - yScale(d.total);
        })
        .attr('fill', function (d) { return fillColor(d.key); })
        .attr('fill-opacity', 0.2)
        .attr('stroke', function (d) { console.log(d.key + ": " + fillColor(d.key)); return fillColor(d.key); })
        .attr('stroke-width', 1)
        .on('mouseover', function(d) {  
          var target = d3.event.target;
            let color = d3.color(fillColor(d.key)).darker();
            d3.select(this)
              .attr('stroke', color)
              .attr('stroke-width', 2);
            tooltip.show(d, target);
          })
        .on('mouseout', function(d) {
          d3.select(this)
            .transition()
            .duration(250)
            .attr('stroke', fillColor(d.key))
            .attr('stroke-width', 1);
          tooltip.hide(d)
        });

        pymChild.sendHeight()
  }

  // console.log(nestData('all', 'all'))
  setupButtons();

}

export default barChart;