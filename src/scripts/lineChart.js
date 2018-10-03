import tip from "d3-tip";
import { addCommas } from "./addCommas";

export default function lineChart() {
  d3.json(
    "https://wola-cam.s3.amazonaws.com/line-chart/1OPJ98qPzTRvW1E12mfdYXWtFBmwSp37vakrG-hfJay8",
    render
  );

  function render(data) {
    var margin = { top: 20, right: 0, bottom: 50, left: 70 };
    // here, we want the full chart to be 700x200, so we determine
    // the width and height by subtracting the margins from those values
    var fullWidth = 900;
    var fullHeight = 400;
    // the width and height values will be used in the ranges of our scales
    var width = fullWidth - margin.right - margin.left;
    var height = fullHeight - margin.top - margin.bottom;

    var svg = d3
      .select("#line-chart")
      .append("svg")
      .attr("viewBox", "0 0 " + fullWidth + " " + fullHeight)
      .append("g")
      // translate it to leave room for the left and top margins
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3
      .scaleBand()
      .rangeRound([0, width])
      .domain(
        data.map(function(d) {
          return d.year;
        })
      )
      .padding(0.25);

    var y = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .domain([
        0,
        d3.max(data, function(d) {
          return +d.amount;
        })
      ]);

    var tooltip = tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function(d) {
        return `$${addCommas(d.amount)}`;
      });

    svg.call(tooltip);

    svg
      .append("g")
      .classed("x axis", true)
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg
      .append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat(d => `$${d3.format(".2s")(d)}`)
      )
      .classed("y axis", true)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Frequency");

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("fill-opacity", 0.2)
      .attr("fill", "#00B5EF")
      .attr("stroke", "#00B5EF")
      .attr("class", "bar")
      .attr("x", function(d) {
        return x(d.year);
      })
      .attr("y", function(d) {
        return y(+d.amount);
      })
      .attr("width", x.bandwidth())
      .attr("height", function(d) {
        return height - y(d.amount);
      })
      .on("mouseover", function(d) {
        var target = d3.event.target;
        let color = d3.color("#00B5EF").darker();
        d3.select(this)
          .attr("stroke", color)
          .attr("stroke-width", 2);
        tooltip.show(d, target);
      })
      .on("mouseout", function(d) {
        d3.select(this)
          .attr("stroke", "#00B5EF")
          .attr("stroke-width", 1);
        tooltip.hide(d);
      });
  }
}
