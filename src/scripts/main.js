/* Bubble chart code adapted from Jim Vallandingham: 
 * 
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
import * as d3 from "d3";
import lineChart from "./lineChart";
import barChart from "./barChart";
import bubbleChart from "./bubbleChart";
import pymChild from "./pymChild";
import Loading from "carbon-components/es/components/loading/loading";
import { english, spanish } from "./language";
import React from "react";
import ReactDOM from "react-dom";
import DataTable from "./DataTable";
import "../css/style.scss";

function displayContent(content) {
  for (var prop in content) {
    content[prop] = content[prop].replace(/\n/g, "<br />");
  }

  var linechart_headline = document.querySelector(".linechart_headline");
  var linechart_description = document.querySelector(".linechart_description");
  var barchart_headline = document.querySelector(".barchart_headline");
  var barchart_description = document.querySelector(".barchart_description");
  var bubblechart_headline = document.querySelector(".bubblechart_headline");
  var bubblechart_description = document.querySelector(
    ".bubblechart_description"
  );

  linechart_headline.innerHTML = content.linechart_headline;
  linechart_description.innerHTML = content.linechart_description;
  barchart_headline.innerHTML = content.barchart_headline;
  barchart_description.innerHTML = content.barchart_description;
  bubblechart_headline.innerHTML = content.bubblechart_headline;
  bubblechart_description.innerHTML = content.bubblechart_description;
}

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(content) {
  displayContent(content);

  //Load the data
  d3.json(data).then(data => {
    LoadingInstance.end();
    lineChart();
    bubbleChart(data);
    barChart(data);
    pymChild.sendHeight();
    const table = document.querySelector("#data-table");
    ReactDOM.render(<DataTable data={data} />, table);
    setTimeout(() => pymChild.sendHeight(), 200);
  });
}

var sources = {
  contentEng:
    "https://wola-cam.s3.amazonaws.com//1ok_GgQXsQgkaTcOQ-80hSJ8Vpc-s0d817M2B3IWW_20",
  dataEng:
    "https://s3.amazonaws.com/wola-cam/data/19dwn5dI7bjj0hS4SNY-uE-lfPq0NrbRMZh5p2ofU4Zo.json",
  contentEsp:
    "https://wola-cam.s3.amazonaws.com//1CuTSneAwqTScwk5ibXCPko_1j8PisfehkKCXvtnakZg",
  dataEsp:
    "https://wola-cam.s3.amazonaws.com//1EvYPlDYDC9jYWgYpQKfzDCaTtgmQ6yOBc7s1lP8TdT0"
};

var content;
var data;

if (english) {
  content = sources.contentEng;
  data = sources.dataEng;
} else if (spanish) {
  content = sources.contentEsp;
  data = sources.dataEsp;
}

const LoadingElement = document.querySelector("[data-loading]");
const LoadingInstance = Loading.create(LoadingElement);

// Load the content.
d3.json(content).then(content => display(content));
