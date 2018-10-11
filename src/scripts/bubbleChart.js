import { colors } from "./colors.js";
import { addCommas } from "./addCommas.js";
import { legendColor } from "d3-svg-legend";
import tip from "d3-tip";
import pymChild from "./pymChild.js";
import translations from "./translations";
import { english, spanish } from "./language";

function bubbleChart() {
  // Constants for sizing
  var width = 1500;
  var height = 700;

  // tooltip for mouseover functionality
  const tooltip = tip()
    .attr("class", "d3-tip bubble-tip")
    .offset(function(d) {
      if (d.country === "Guatemala") return [0, 10];
      if (d.country === "Honduras") return [-10, 0];
      if (d.country === "El Salvador") return [-10, 0];
      if (d.country === "Other Countries/Regional") return [0, -10];
    })
    .html(function(d) {
      return showDetail(d);
    })
    .direction(function(d) {
      if (d.country === "Guatemala") return "e";
      if (d.country === "Honduras") return "n";
      if (d.country === "El Salvador") return "n";
      if (d.country === "Other Countries/Regional") return "w";
    });

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 + 200 };
  var trueCenterY = height / 2;

  var countryCenters = {
    Guatemala: { x: width / 5, y: height / 2 },
    Honduras: { x: (2 * width) / 5, y: height / 2 },
    "El Salvador": { x: (3 * width) / 5, y: height / 2 },
    "Other Countries/Regional": { x: (4 * width) / 5, y: height / 2 }
  };

  // @v4 strength to apply to the position forces
  var forceStrength = 0.03;

  // These will be set in create_nodes and create_vis
  var svg = d3
    .select("#vis")
    .append("svg")
    .attr("viewBox", "0 0 " + width + " " + height);
  var bubbles = null;
  var nodes = [];

  var filterState = {
    display: null,
    year: null
  };

  var maxRadius = height * 0.06;
  var maxDatum;
  var scale;
  var fillColor;

  var categoriesSet = new Set();
  var yearsSet = new Set();
  var categories;
  var years;

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3
    .forceSimulation()
    .velocityDecay(0.6)
    .force("x", d3.forceX(nodeCountryPos).strength(0.4))
    .force("y-center", d3.forceY(center.y).strength(0.1))
    .force(
      "y",
      d3
        .forceY(function(d) {
          var yScale = d3
            .scalePoint()
            .domain(categories)
            .range([300, height - 100]);
          return yScale(d.category);
        })
        .strength(0.8)
    )
    .force(
      "collide",
      d3.forceCollide(function(d) {
        return d.radius + 2;
      })
    )
    .on("tick", ticked);

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
    var maxAmount = d3.max(rawData, function(d) {
      return +d.total;
    });
    maxDatum = maxAmount;
    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3
      .scaleSqrt()
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
        account: d.account,
        x: width / 2,
        y: height / 2,
        description: d.description
      };
      categoriesSet.add(d.category);
      yearsSet.add(d.year);
      return d;
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function(a, b) {
      return b.value - a.value;
    });

    categories = Array.from(categoriesSet).sort(function(a, b) {
      return d3.ascending(a, b);
    });
    years = Array.from(yearsSet).sort(function(a, b) {
      return b - a;
    });

    fillColor = d3
      .scaleOrdinal()
      .domain(categories)
      .range(colors);

    scale = radiusScale;

    return myNodes;
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
    createLegend();
    chart.updateData(filterState.display, filterState.year);
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

    if (displayFilter && displayFilter !== "all") {
      var filtered = nodes.filter(function(val) {
        return val.category === displayFilter && +val.year === +yearFilter;
      });
      simulation.force("y", d3.forceY(trueCenterY).strength(0.25));
    } else {
      var filtered = nodes.filter(function(val) {
        return +val.year === +yearFilter;
      });
      simulation.force(
        "y",
        d3
          .forceY(function(d) {
            var yScale = d3
              .scalePoint()
              .domain(categories)
              .rangeRound([300, height - 150]);
            return yScale(d.category);
          })
          .strength(0.4)
      );
    }

    bubbles = svg.selectAll(".bubble").data(filtered || nodes, function(d) {
      return d.id;
    });

    bubbles.exit().remove();

    svg.call(tooltip);

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.

    var tooltipOpen = false;

    d3.select("body").on("click", function() {
      var inside = d3.selectAll(".selected, .d3-tip, .d3-tip *");

      var outside = inside
        .filter(function() {
          return this === d3.event.target;
        })
        .empty();

      if (outside && tooltipOpen) {
        d3.select(".selected").attr("stroke", function(d) {
          return fillColor(d.category);
        });
        d3.select(".selected").attr("stroke-width", 1);
        d3.select(".selected").classed("selected", false);
        tooltip.hide(d3.select(".selected"));
        tooltipOpen = false;
      }
    });

    var bubblesE = bubbles
      .enter()
      .append("circle")
      .classed("bubble", true)
      .attr("r", 0)
      .attr("fill", function(d) {
        return fillColor(d.category);
      })
      .attr("fill-opacity", 0.2)
      .attr("stroke", function(d) {
        return fillColor(d.category);
      })
      .attr("stroke-width", 1)
      .on("mouseover", d => {
        if (!tooltipOpen) {
          d3.select(d3.event.target).attr(
            "stroke",
            d3.rgb(fillColor(d.category)).darker()
          );
          d3.select(d3.event.target).attr("stroke-width", 1.5);
          tooltip.show(d, d3.event.target);
        }
      })
      .on("mouseout", d => {
        if (!tooltipOpen) {
          d3.select(d3.event.target).attr("stroke", fillColor(d.category));
          d3.select(d3.event.target).attr("stroke-width", 1);
          tooltip.hide(d, d3.event.target);
        }
      })
      .on("click", d => {
        var target = d3.select(d3.event.target);
        var eventTarget = d3.event.target;
        target.attr("stroke", d3.rgb(fillColor(d.category)).darker());
        target.attr("stroke-width", 1.5);
        target.classed("selected", true);
        tooltipOpen = true;
        tooltip.show(d, d3.event.target);
        var tooltipEl = document.querySelector(".bubble-tip");
        var tooltipInitialHeight = tooltipEl.offsetHeight;
        document
          .querySelector(".js-read-more")
          .addEventListener("click", function(e) {
            e.preventDefault();
            document.querySelector(".js-description").innerHTML = d.description;
            var tooltipAfterHeight = tooltipEl.offsetHeight;
            var offset = tooltipAfterHeight - tooltipInitialHeight;
            if (d.country !== "Honduras") {
              tooltipEl.style.top = tooltipEl.offsetTop - offset / 2 + "px";
            } else {
              tooltipEl.style.top = tooltipEl.offsetTop - offset + "px";
            }
            this.classList.add("dn");
          });
      });

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles
      .transition()
      .duration(2000)
      .attr("r", function(d) {
        return d.radius;
      });
    // .style('opacity', 1)

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(filtered || nodes);

    // Set initial layout to single group.
    showCountryTotals(filtered || nodes);
    simulation.alpha(1).restart();

    pymChild.sendHeight();
  };

  function createLegend() {
    console.log(categories);
    var scale = d3
      .scaleOrdinal()
      .domain(categories)
      .range(colors);

    var l = circleLegend(svg)
      .domain([0, maxDatum]) // the dataset min and max
      .range([4, maxRadius]) // the circle area/size mapping
      .values([3000000, 30000000]) // pass in values (e.g. min,mean/median & max)
      // optional
      .width(300) // it centers to this
      .height(125) // it centers to this
      .suffix("") // ability to pass in a suffix e.g. '%'
      .circleColor("#888") // stroke of the circles
      .textPadding(25) // left padding on text
      .textColor("#454545"); // the fill for text

    // and render it
    l.render();

    svg
      .append("g")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate(400,50)");

    var legendOrdinal = legendColor()
      //d3 symbol creates a path-string, for example
      //"M0,-8.059274488676564L9.306048591020996,
      //8.059274488676564 -9.306048591020996,8.059274488676564Z"
      .shapePadding(250)
      .shapeWidth(45)
      .shapeHeight(20)
      .labelOffset(15)
      .orient("horizontal")
      .labelWrap(250)
      //use cellFilter to hide the "e" cell
      .scale(scale);

    svg.select(".legendOrdinal").call(legendOrdinal);

    svg
      .selectAll(".legendOrdinal .swatch")
      .style("fill-opacity", 0.2)
      .style("stroke", function(d) {
        return fillColor(d);
      });
  }

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });
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
    d3.select("#category")
      .on("change", function() {
        d3.event.preventDefault();

        filterState.display = this.value;

        // Toggle the bubble chart based on
        // the currently clicked button.
        chart.updateData(filterState.display, filterState.year);
      })
      .selectAll("option.category")
      .data(categories)
      .enter()
      .append("option")
      .property("value", function(d) {
        return d;
      })
      .text(function(d) {
        return d;
      });
    filterState.display = d3.select("#category").value;
  }

  function yearFilter() {
    var select = d3
      .select("#year")
      .on("change", function() {
        filterState.year = this.value;
        chart.updateData(filterState.display, filterState.year);
      })
      .selectAll("option")
      .data(years)
      .enter()
      .append("option")
      .property("value", function(d) {
        return d;
      })
      .text(function(d) {
        return d;
      });

    filterState.year = document.querySelector("#year").value;
  }

  /*
   * Shows Year title displays.
   */
  function showCountryTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    // var total = nodes.reduce(function(acc, cur) {  })
    var countryData = d3.keys(countryCenters);

    console.log(countryData);

    var countries = svg.selectAll(".country").data(countryData);

    countries
      .enter()
      .append("g")
      .attr("class", "country")
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", function(d) {
        return countryCenters[d].x;
      })
      .attr("y", 170)
      .text(function(d) {
        if (spanish && d === "Other Countries/Regional") {
          return "Otros Países/Regional";
        } else {
          return d;
        }
      });
  }

  function showCountryTotals(inputNodes) {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    // var total = nodes.reduce(function(acc, cur) {  })
    var countryData = d3.keys(countryCenters);

    function countryTotal(country) {
      return inputNodes
        .filter(function(val) {
          return val.country === country;
        })
        .reduce(function(acc, cur) {
          return acc + cur.value;
        }, 0);
    }

    var totals = svg
      .selectAll(".total")
      .data(countryData)
      .text(function(d) {
        return "$" + addCommas(countryTotal(d).toString());
      });

    totals.exit().remove();

    totals
      .enter()
      .append("text")
      .attr("class", "total")
      .attr("x", function(d) {
        return countryCenters[d].x;
      })
      .attr("y", 195)
      .attr("text-anchor", "middle")
      .text(function(d) {
        return "$" + addCommas(countryTotal(d).toString());
      })
      .merge(totals);
  }

  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    var content = `
      <div class="pa1 lh-title">
        <div class="ttu mid-gray f6 fw6"><span class="pr1">${
          d.name
        }</span><span class="ph1">&#8226;</span><span class="pl1">${
      d.year
    }</span></div>
        <div class="pv2 f3">$${addCommas(d.value)}</div>
        ${
          d.account
            ? `<div class="pb1 mid-gray f6"><span class="name">${
                english
                  ? translations.fundingSource.eng
                  : translations.fundingSource.esp
              }: </span><span class="value">${d.account}</span></div>`
            : ""
        }
        ${
          d.description
            ? `<div class="pt2 mt2 bt b--light-gray overflow-scroll" style="max-height: 8rem;"><span class="name b f6">${
                english
                  ? translations.description.eng
                  : translations.description.esp
              }: </span><span class="value f6 js-description">${
                d.description ? d.description.substring(0, 120) : ""
              }...</span><a href="#" class="link f7 mv1 dim underline-hover wola-blue pl1 js-read-more">${
                english ? translations.readMore.eng : translations.readMore.esp
              }</a></div>`
            : ""
        }
      </div>
    `;

    return content;
  }

  function circleLegend(selection) {
    let instance = {};

    // set some defaults
    const api = {
      domain: [0, 100], // the values min and max
      range: [0, 80], // the circle area/size mapping
      values: [8, 34, 89], // values for circles
      width: 500,
      height: 500,
      suffix: "", // ability to pass in a suffix
      circleColor: "#888",
      textPadding: 40,
      textColor: "#454545"
    };

    const sqrtScale = scale;

    instance.render = function() {
      const s = selection
        .append("g")
        .attr("class", "legend-wrap")
        // push down to radius of largest circle
        .attr(
          "transform",
          "translate(0," + sqrtScale(d3.max(api.values)) + ")"
        );

      // append the values for circles
      s.append("g")
        .attr("class", "values-wrap")
        .selectAll("circle")
        .data(api.values)
        .enter()
        .append("circle")
        .attr("class", d => "values values-" + d)
        .attr("r", d => sqrtScale(d))
        .attr("cx", api.width / 2)
        .attr("cy", d => api.height / 2 - sqrtScale(d))
        .style("fill", "none")
        .style("stroke", api.circleColor)
        .style("opacity", 0.5);

      // append some lines based on values
      s.append("g")
        .attr("class", "values-line-wrap")
        .selectAll(".values-labels")
        .data(api.values)
        .enter()
        .append("line")
        .attr("x1", d => api.width / 2 + sqrtScale(d))
        .attr("x2", api.width / 2 + sqrtScale(api.domain[1]) + 20)
        .attr("y1", d => api.height / 2 - sqrtScale(d))
        .attr("y2", d => api.height / 2 - sqrtScale(d))
        .style("stroke", api.textColor)
        .style("stroke-dasharray", "2,2");

      // append some labels from values
      s.append("g")
        .attr("class", "values-labels-wrap")
        .selectAll(".values-labels")
        .data(api.values)
        .enter()
        .append("text")
        .attr("x", api.width / 2 + sqrtScale(api.domain[1]) + api.textPadding)
        .attr("y", d => api.height / 2 - sqrtScale(d) + 5)
        .attr("shape-rendering", "crispEdges")
        .style("text-anchor", "start")
        .style("fill", api.textColor)
        .text(d => d3.format("$.0s")(d) + api.suffix);

      return instance;
    };

    for (let key in api) {
      instance[key] = getSet(key, instance).bind(api);
    }

    return instance;

    // https://gist.github.com/gneatgeek/5892586
    function getSet(option, component) {
      return function(_) {
        if (!arguments.length) {
          return this[option];
        }
        this[option] = _;
        return component;
      };
    }
  }

  // return the chart function from closure.
  return chart;
}

export default bubbleChart();
