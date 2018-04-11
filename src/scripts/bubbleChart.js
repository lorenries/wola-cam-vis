import floatingTooltip from './tooltip.js';
import fillColor from './fillColor.js';
import addCommas from './addCommas.js';
import d3Tip from 'd3-tip';
import pym from 'pym.js';
d3.tip = d3Tip;

function bubbleChart() {
  // Constants for sizing
  var width = 1500;
  var height = 700;

  // tooltip for mouseover functionality
  // var tooltip = floatingTooltip('gates_tooltip', 240);
  const tooltip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function(d) { return showDetail(d) })

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var countryCenters = {
    Guatemala: { x: width / 6, y: height / 2 },
    Honduras: { x: width / 2, y: height / 2 },
    ElSalvador: { x: 5 * width / 6, y: height / 2 }
  };

  // @v4 strength to apply to the position forces
  var forceStrength = 0.03;

  // These will be set in create_nodes and create_vis
  var svg = d3.select('#vis')
  .append('svg')
  .attr('viewBox', '0 0 ' + width + ' ' + height);
  var bubbles = null;
  var nodes = [];

  var filterState = {
    display: null,
    year: null,
  }

  var maxRadius = height*0.1;
  var scale;

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
  .velocityDecay(0.6)
  .force('x', d3.forceX(nodeCountryPos).strength(0.2))
  .force('y-center', d3.forceY(center.y).strength(0.15))
  .force('y', d3.forceY(function(d) {
    var yScale = d3.scaleLinear().domain([1, 5]).range([200,height-200]);
    d.scalePos = yScale(d.group);
    return yScale(d.group)
  }).strength(0.4))
  .force("collide", d3.forceCollide(function(d) { return d.radius + 2 }))
  .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
   function createNodes(rawData) {
    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxAmount = d3.max(rawData, function (d) { return +d.total; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scaleSqrt()
    // .exponent(0.5)
    .range([4, maxRadius])
    .domain([0, maxAmount]);

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function(d, i) {
      var scaledRadius = radiusScale(+d.total);
      d = {
        id: i,
        radius: scaledRadius,
        value: +d.total,
        name: d.program_name,
        country: d.country,
        category: d.category,
        year: d.year,
        group: +d.cluster_code,
        x: width / 2,
        y: height / 2
      };
      return d;
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    scale = radiusScale;

    return myNodes;
  }

  function createLegend(scale) {

  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
   var chart = function chart(rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);
    showCountryTitles();
    yearFilter();
    displayFilter();
    chart.updateData(filterState.display, filterState.year);
    createLegend(scale);
  };

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
   chart.updateData = function(displayFilter, yearFilter) {

     // Bind nodes data to what will become DOM elements to represent them.

     if (displayFilter && displayFilter !== 'all') {
      var filtered = nodes.filter(function(val) { return val.category === displayFilter && +val.year === +yearFilter});
      simulation.force("y", d3.forceY(center.y).strength(0.05));
    } else {
      var filtered = nodes.filter(function(val) { return +val.year === +yearFilter});
      simulation.force('y', d3.forceY(function(d) {
        var yScale = d3.scaleLinear().domain([1, 5]).range([250,height-250]);
        d.scalePos = yScale(d.group);
        return yScale(d.group)
      }).strength(0.4));
    }

    bubbles = svg.selectAll('.bubble')
    .data(filtered || nodes, function(d) { return d.id });

    bubbles.exit().remove();

    svg.call(tooltip)

     // Create new circle elements each with class `bubble`.
     // There will be one circle.bubble for each object in the nodes array.
     // Initially, their radius (r attribute) will be 0.
     // @v4 Selections are immutable, so lets capture the
     //  enter selection to apply our transtition to below.
     var bubblesE = bubbles.enter().append('circle')
     .classed('bubble', true)
     .attr('r', 0)
     .attr('fill', function (d) { return fillColor(d.category); })
     .attr('fill-opacity', 0.2)
     .attr('stroke', function (d) { return fillColor(d.category); })
     .attr('stroke-width', 1)
       // .style('opacity', 0)
       // .on('click', showDetail)
     .on('mouseover', (d) => { 
        d3.select(d3.event.target).attr('stroke', d3.rgb(fillColor(d.category)).darker());
        d3.select(d3.event.target).attr('stroke-width', 1.5);
        tooltip.show(d, d3.event.target);
      })
     .on('mouseout', (d) => {
        d3.select(d3.event.target).attr('stroke', fillColor(d.category));
        d3.select(d3.event.target).attr('stroke-width', 1);
        tooltip.hide(d, d3.event.target);
     });

     // @v4 Merge the original empty selection and the enter selection
     bubbles = bubbles.merge(bubblesE);

     // Fancy transition to make bubbles appear, ending with the
     // correct radius
     bubbles.transition()
     .duration(2000)
     .attr('r', function (d) { return d.radius; });
       // .style('opacity', 1)

     // Set the simulation's nodes to our newly created nodes array.
     // @v4 Once we set the nodes, the simulation will start running automatically!
     simulation.nodes(filtered || nodes);

     // Set initial layout to single group.
     showCountryTotals(filtered || nodes);
     simulation.alpha(1).restart();
     // pymChild.sendHeight()
   };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
   function ticked() {
    bubbles
    .attr('cx', function (d) { return d.x; })
    .attr('cy', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by year
   * x force.
   */
   function nodeCountryPos(d) {
    return countryCenters[d.country].x;
  }

  /*
   * Sets up the layout buttons to allow for toggling between view modes.
   */
   function displayFilter() {
    d3.select('#bubble-toolbar')
    .selectAll('.button')
    .on('click', function () {
        d3.event.preventDefault();
        // Remove active class from all buttons
        d3.selectAll('#bubble-toolbar .button').classed('active', false);
        // Find the button just clicked
        var button = d3.select(this);

        // Set it as the active button
        button.classed('active', true);

        // Get the id of the button
        var buttonId = button.attr('id');

        filterState.display = buttonId;

        // Toggle the bubble chart based on
        // the currently clicked button.
        chart.updateData(filterState.display, filterState.year);
      });

    filterState.display = d3.select('#bubble-toolbar').select('.active').attr('id');
  }

  function yearFilter() {

    var yearsSet = new Set();
    nodes.forEach(function(val) { yearsSet.add(val.year) })
    var yearsArr = Array.from(yearsSet).sort(function(a,b) {return b-a;});
    
    var select = d3.select('#year')
    .on('change', function() { 
      filterState.year = this.value;
      chart.updateData(filterState.display, filterState.year) 
    })
    .selectAll('option')
    .data(yearsArr)
    .enter()
    .append('option')
    .property('value', function(d) { return d; })
    .text(function(d) { return d; });

    filterState.year = document.querySelector('#year').value;

  }

  /*
   * Shows Year title displays.
   */
   function showCountryTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    // var total = nodes.reduce(function(acc, cur) {  })
    var countryData = d3.keys(countryCenters);

    var countries = svg.selectAll('.country')
    .data(countryData);

    countries.enter().append('g')
    .attr('class', 'country')
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('x', function (d) { return countryCenters[d].x; })
    .attr('y', 60)
    .text(function (d) { if (d === 'ElSalvador') return 'El Salvador'; else return d });
  }

  function showCountryTotals(inputNodes) {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    // var total = nodes.reduce(function(acc, cur) {  })
    var countryData = d3.keys(countryCenters);

    function countryTotal(country) {
      return inputNodes.filter(function(val) { return val.country === country }).reduce(function(acc, cur) { return acc + cur.value; }, 0);
    }

    var totals = svg.selectAll('.total')
    .data(countryData)
    .text(function (d) { return '$' + addCommas(countryTotal(d).toString()); });

    totals.exit().remove();

    totals.enter().append('text')
    .attr('class', 'total')
    .attr('x', function (d) { return countryCenters[d].x; })
    .attr('y', 85)
    .attr('text-anchor', 'middle')
    .text(function (d) { return '$' + addCommas(countryTotal(d).toString()); })
    .merge(totals);
  }


  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
   function showDetail(d) {

    // var content = '<span class="name">Program: </span><span class="value">' +
    // d.name +
    // '</span><br/>' +
    // '<span class="name">Total: </span><span class="value">$' +
    // addCommas((d.value)) +
    // '</span><br/>' +
    // '<span class="name">Year: </span><span class="value">' +
    // d.year +
    // '</span>';

    var content = `
      <div class="pa1 lh-title">
        <div class=""><span class="name b">Program: </span><span class="value">${d.name}</span></div>
        <div class=""><span class="name b">Total: </span><span class="value">$${addCommas((d.value))}</span></div>
        <div class=""><span class="name b">Year: </span><span class="value">${d.year}</span></div>
      </div>
    `

    return content;
  }


  // return the chart function from closure.
  return chart;
}

export default bubbleChart();