import { colors } from './colors.js';
import { addCommas } from './addCommas.js';
import tip from 'd3-tip';
import pymChild from './pymChild.js';
import { english, spanish } from './language';
import translations from './translations';

function barChart(data) {
  var margin = { top: 20, right: 5, bottom: 89, left: 110 };
  // here, we want the full chart to be 700x200, so we determine
  // the width and height by subtracting the margins from those values
  var fullWidth = 900;
  var fullHeight = 500;
  // the width and height values will be used in the ranges of our scales
  var width = fullWidth - margin.right - margin.left;
  var height = fullHeight - margin.top - margin.bottom;

  var svg = d3
    .select('#bar-chart')
    .append('svg')
    .attr('viewBox', '0 0 ' + fullWidth + ' ' + fullHeight)
    .append('g')
    // translate it to leave room for the left and top margins
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var barHolder = svg.append('g').classed('bar-holder', true);

  var chartState = {
    country: 'all-countries'
  };

  function nestData(country) {
    var dataByCountry = data.filter(function(d) {
      if (country === 'all-countries' || !country) {
        return true;
      } else {
        return d.country === country;
      }
    });

    var grouped = d3
      .nest()
      .key(function(d) {
        return d.category;
      })
      .key(function(d) {
        return d.year;
      })
      .sortKeys(d3.ascending)
      .rollup(function(v) {
        return d3.sum(v, function(d) {
          return d.total;
        });
      })
      .entries(dataByCountry);

    return grouped;
  }

  var initializedData = nestData('all-countries');

  var max = d3.max(nestData('all-countries'), function(d) {
    return d3.max(d.values, function(val) {
      return val.value;
    });
  });

  var categories = initializedData
    .map(function(val) {
      return val.key;
    })
    .sort(function(a, b) {
      return d3.ascending(a, b);
    });

  var years = initializedData.reduce(function(acc, curr) {
    curr.values.forEach(val => {
      if (!acc.includes(val.key)) {
        acc.push(val.key);
      }
    });
    return acc;
  }, []);

  var fillColor = d3
    .scaleOrdinal()
    .domain(categories)
    .range(colors);

  var xScale = d3
    .scaleBand()
    .domain(categories)
    .range([0, width])
    .paddingInner(0.25);

  var x0 = d3
    .scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05);

  var x1 = d3.scaleBand().padding(0.1);

  x0.domain(categories);
  x1.domain(years).rangeRound([0, x0.bandwidth()]);

  var yScale = d3
    .scaleLinear()
    .domain([0, max])
    .range([height, 0]);

  var formatValue = d3.format('.2s');

  var xAxis = d3.axisBottom(x0);

  var yAxis = d3
    .axisLeft(yScale)
    .ticks(4)
    .tickFormat(function(d) {
      return '$' + formatValue(d);
    });

  var xAxisEle = svg
    .append('g')
    .classed('x axis', true)
    .attr('transform', 'translate(0,' + (height + 22) + ')')
    .call(xAxis);

  var yAxisEle = svg
    .append('g')
    .classed('y axis', true)
    .call(yAxis)
    .attr('transform', 'translate(-15, 0)');

  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -90)
    .attr('x', -height / 2)
    .attr('font-size', '14')
    .style('text-anchor', 'middle')
    .text(function(d) {
      return english
        ? translations.amountUsDollars.eng
        : translations.amountUsDollars.esp;
    });

  var tooltip = tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return `$${addCommas(d.value)}`;
    });

  svg.call(tooltip);

  function setupButtons() {
    d3
      .select('#countries-toolbar')
      .selectAll('.button')
      .on('click', function() {
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
        updateChart(chartState.country);
      });
  }

  function updateChart(country) {
    var initializedData = nestData(country);
    var groups = barHolder.selectAll('.group').data(initializedData);

    var bars = groups
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('transform', function(d) {
        return 'translate(' + x0(d.key) + ',0)';
      });

    bars
      .selectAll('rect')
      .data(function(d) {
        d.values.forEach(val => (val.category = d.key));
        return d.values;
      })
      .enter()
      .append('rect')
      .attr('width', x1.bandwidth())
      .attr('x', function(d) {
        return x1(d.key);
      })
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('height', function(d) {
        return height - yScale(d.value);
      })
      .style('fill', function(d) {
        return fillColor(d.category);
      })
      .attr('fill-opacity', 0.2)
      .attr('stroke', function(d) {
        return fillColor(d.category);
      })
      .attr('stroke-width', 1)
      .classed('bar', true)
      .on('mouseover', function(d) {
        var target = d3.event.target;
        let color = d3.color(fillColor(d.category)).darker();
        d3
          .select(this)
          .attr('stroke', color)
          .attr('stroke-width', 2);
        tooltip.show(d, target);
      })
      .on('mouseout', function(d) {
        d3
          .select(this)
          .attr('stroke', fillColor(d.category))
          .attr('stroke-width', 1);
        tooltip.hide(d);
      });

    bars
      .selectAll('text')
      .data(function(d) {
        d.values.forEach(val => (val.category = d.key));
        return d.values;
      })
      .enter()
      .append('text')
      .attr('y', function(d) {
        return height + 19;
      })
      .attr('x', function(d) {
        return x1(d.key) + x1.bandwidth() / 2;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '14')
      .text(function(d) {
        return d.key;
      });

    svg.selectAll('.x .tick text').call(wrap, x0.bandwidth());

    groups
      .selectAll('rect')
      .data(function(d) {
        d.values.forEach(val => (val.category = d.key));
        return d.values;
      })
      .transition()
      .attr('y', function(d) {
        return yScale(d.value);
      })
      .attr('height', function(d) {
        return height - yScale(d.value);
      });
  }

  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
        words = text
          .text()
          .split(/\s+/)
          .reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr('y'),
        dy = parseFloat(text.attr('dy')),
        tspan = text
          .text(null)
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', dy + 'em');
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', `${++lineNumber * lineHeight + dy}em`)
            .text(word);
        }
      }
    });
  }

  setupButtons();
  updateChart('all-countries');
}

export default barChart;
