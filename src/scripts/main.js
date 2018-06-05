/* Bubble chart code adapted from Jim Vallandingham: 
 * 
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
import barChart from './barChart';
import bubbleChart from './bubbleChart';
import pivotTable from './pivotTable';
import pymChild from './pymChild';
import Loading from 'carbon-components/es/components/loading/loading';
import { english, spanish } from './language';
import style from '../css/style.scss';

function displayContent(content) {
  for (var prop in content) {
    content[prop] = content[prop].replace(/\n/g, '<br />');
  }

  var headline1 = document.querySelector('.headline1');
  var description1 = document.querySelector('.description1');
  var headline2 = document.querySelector('.headline2');
  var description2 = document.querySelector('.description2');

  headline1.innerHTML = content.headline1;
  description1.innerHTML = content.description1;
  headline2.innerHTML = content.headline2;
  description2.innerHTML = content.description2;
}

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, content) {
  if (error) {
    console.log(error);
  }

  //Load the data
  d3.json(data, function(error, data) {
    if (error) {
      console.log(error);
    }
    LoadingInstance.end();
    displayContent(content);
    bubbleChart(data);
    barChart(data);
    pivotTable(data);
    pymChild.sendHeight();
  });
}

var sources = {
  contentEng:
    'https://wola-cam.s3.amazonaws.com//1ok_GgQXsQgkaTcOQ-80hSJ8Vpc-s0d817M2B3IWW_20',
  dataEng:
    'https://s3.amazonaws.com/wola-cam//19dwn5dI7bjj0hS4SNY-uE-lfPq0NrbRMZh5p2ofU4Zo',
  contentEsp:
    'https://wola-cam.s3.amazonaws.com//1CuTSneAwqTScwk5ibXCPko_1j8PisfehkKCXvtnakZg',
  dataEsp:
    'https://wola-cam.s3.amazonaws.com//1EvYPlDYDC9jYWgYpQKfzDCaTtgmQ6yOBc7s1lP8TdT0'
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

const LoadingElement = document.querySelector('[data-loading]');
const LoadingInstance = Loading.create(LoadingElement);

// Load the content.
d3.json(content, display);
