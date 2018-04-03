/* Bubble chart code adapted from Jim Vallandingham: 
 * 
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
import DataTableV2 from 'carbon-components/es/components/data-table-v2/data-table-v2';
import Pagination from 'carbon-components/es/components/pagination/pagination';
import bubbleChart from './bubbleChart.js';
import barChart from './barChart.js';
import List from 'list.js';

console.log(DataTableV2)

function pivotTable(data) {

  function rowTemplate(d) {
    return `
    <tr class="bx--parent-row-v2" data-parent-row>
      <td class="bx--table-expand-v2" data-event="expand">
        <button class="bx--table-expand-v2__button">
          <svg class="bx--table-expand-v2__svg" width="8" height="12" viewBox="0 0 8 12" fill-rule="evenodd">
            <path d="M0 10.6L4.7 6 0 1.4 1.4 0l6.1 6-6.1 6z"></path>
          </svg>
        </button>
      </td>
      <td class="program">${d.program_name}</td>
      <td class="total">${d.total}</td>
      <td class="year">${d.year}</td>
      <td class="category">${d.category}</td>
      <td class="country">${d.country}</td>
      <td class="account">${d.account}</td>
      <td class="source">${d.source}</td>
    </tr>
    <tr class="bx--expandable-row-v2 bx--expandable-row--hidden-v2" data-child-row>
      <td colspan="8">
        <h4>
          <strong>Description</strong>
        </h4>
        <p>${d.description}</p>
      </td>
    </tr>
    `;
  }

  d3.select('#table-body').selectAll('.temp-wrapper')
    .data(data)
    .enter().append('tbody')
    .classed('temp-wrapper', true)
    .html(rowTemplate);

  document.querySelectorAll('tbody.temp-wrapper').forEach(function(val) {
    while (val.firstChild) {
        val.parentNode.insertBefore(val.firstChild, val);
    }
    val.parentNode.removeChild(val);
  })

  const tableElement = document.querySelector('[data-table-v2]');
  const tableInstance = DataTableV2.create(tableElement)

  // const paginationEl = document.querySelector('[data-pagination]');
  // const paginationInstance = Pagination.create(paginationEl);

  // paginationEl.addEventListener('eventPageChange', function(e) { console.log('fired') })

  // paginationEl.addEventListener('eventPageChange', function(e) {
  //   console.log(document.querySelector(paginationInstance.options.selectorItemsPerPageInput).value)
  // })

  // console.log(document.querySelector(paginationInstance.options.selectorItemsPerPageInput).value)
  // DataTableV2.refreshRows();

  console.log(tableInstance)

  // const paginationElement = document.querySelector('[data-pagination]');
  // const paginationInstance = Pagination.create(tableElement);
  var options = {
    valueNames: [ "program", "total", "year", "category", "country", "account", "source" ],
    page: 10,
    pagination: [{
      name: "pagination",
      paginationClass: "pagination", 
      innerWindow: 0
    }]
  };
  var list = new List('sort', options);
  tableInstance.refreshRows();

  var numberOfItems = document.querySelector('[data-total-items]');

  list.on('updated', function() {
    numberOfItems.innerHTML = list.matchingItems.length;
    updateRange()
    tableInstance.refreshRows();
  });

  var selectItemsPerPage = document.querySelector('[data-items-per-page]');

  selectItemsPerPage.addEventListener('change', (e) => {
    var numItems = e.target.value;
    list.page = numItems;
    updateRange();
    list.update();
    console.log(numItems)
  })

  function updateRange() {
    var numberOfItems = selectItemsPerPage.value;
    var displayedItemRange = document.querySelector('[data-displayed-item-range]')
    var range = +list.i + +numberOfItems - 1;
    console.log(range)
    displayedItemRange.innerHTML = `${list.i}-${range}`;
  }

}

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
 function display(error, data) {
  if (error) {
    console.log(error);
  }

  // Create a SVG element inside the provided selector
  // with desired size.

  bubbleChart(data);
  barChart(data);
  pivotTable(data);
}

var dataUrl = 'https://s3.amazonaws.com/wola-cam//19dwn5dI7bjj0hS4SNY-uE-lfPq0NrbRMZh5p2ofU4Zo';

var localJson = '../data/data.json';
// Load the data.
d3.json(dataUrl, display);