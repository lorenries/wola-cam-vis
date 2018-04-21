/* Bubble chart code adapted from Jim Vallandingham: 
 * 
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
import DataTableV2 from 'carbon-components/es/components/data-table-v2/data-table-v2';
import Pagination from 'carbon-components/es/components/pagination/pagination';
import { addCommas } from './addCommas.js';
import barChart from './barChart.js';
import bubbleChart from './bubbleChart.js';
import List from 'list.js';
import pymChild from './pymChild.js';

function pivotTable(data) {
  function rowTemplate(d) {
    var country;

    if (d.country === 'ElSalvador') {
      country = 'El Salvador';
    } else {
      country = d.country;
    }

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
      <td class="total" data-total="${d.total}">$${addCommas(d.total)}</td>
      <td class="year">${d.year}</td>
      <td class="category">${d.category}</td>
      <td class="country">${country}</td>
      <td class="account">${d.account ? d.account : ''}</td>
      <td class="description dn">${d.description}</td>
      <td class="source">${d.source ? d.source : ''}</td>
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

  d3
    .select('#table-body')
    .selectAll('.temp-wrapper')
    .data(data)
    .enter()
    .append('tbody')
    .classed('temp-wrapper', true)
    .html(rowTemplate);

  document.querySelectorAll('tbody.temp-wrapper').forEach(function(val) {
    while (val.firstChild) {
      val.parentNode.insertBefore(val.firstChild, val);
    }
    val.parentNode.removeChild(val);
  });

  const tableElement = document.querySelector('[data-table-v2]');
  const tableInstance = DataTableV2.create(tableElement);

  var options = {
    valueNames: [
      'program',
      { name: 'total', attr: 'data-total' },
      'year',
      'category',
      'country',
      'account',
      'source',
      'description'
    ],
    page: 10
  };
  var list = new List('sort', options);

  tableInstance.refreshRows();

  var numberOfItems = document.querySelector('[data-total-items]');
  var selectItemsPerPage = document.querySelector('[data-items-per-page]');
  var forwardPaginationButton = document.querySelector('[data-page-forward]');
  var backwardPaginationButton = document.querySelector('[data-page-backward]');
  var paginationSelect = document.querySelector('[data-page-number-input]');
  var displayedPageNumber = document.querySelector(
    '[data-displayed-page-number]'
  );
  var totalPages = document.querySelector('[data-total-pages]');

  // update pagination function
  // number of pages = number of items / items per page
  // append appropriate number to select

  function updatePagination() {
    var numberOfPages = Math.ceil(list.matchingItems.length / list.page);
    var range = document.createRange();
    range.selectNodeContents(paginationSelect);
    range.deleteContents();
    for (var i = 1; i <= numberOfPages; i++) {
      var option = document.createElement('option');
      option.classList.add('bx--select-option');
      option.setAttribute('value', i);
      option.innerHTML = i;
      paginationSelect.appendChild(option);
    }
    paginationSelect.selectedIndex = (list.i - 1) / list.page;
  }

  updatePagination();
  updatePaginationRange();

  // on forward click
  // list.i = select value + 1 * list.page
  // select goes up 1
  // table.show(i, list.page)

  forwardPaginationButton.addEventListener('click', function(e) {
    if (paginationSelect.value != paginationSelect.length) {
      list.i = paginationSelect.value * list.page + 1;
      paginationSelect.selectedIndex++;
      list.show(list.i, list.page);
    }
  });

  // on backward click
  // list.i = select value - 1 * list.page
  // select value goes down one
  // table.show(i, list.page)

  backwardPaginationButton.addEventListener('click', function(e) {
    if (paginationSelect.value != 1) {
      list.i = list.i - list.page;
      paginationSelect.selectedIndex--;
      list.show(list.i, list.page);
    }
  });

  // on select change
  // list.i = select value * list.page
  // table.show(list.i, list.page)

  paginationSelect.addEventListener('change', function(e) {
    list.i = (e.target.value - 1) * list.page + 1;
    list.show(list.i, list.page);
  });

  numberOfItems.innerHTML = list.matchingItems.length;
  updateRange();

  var numberOfPages = +numberOfItems.innerHTML / +selectItemsPerPage.value;

  list.on('updated', function(e) {
    numberOfItems.innerHTML = list.matchingItems.length;
    updateRange();
    updatePagination();
    updatePaginationRange();
    tableInstance.refreshRows();
    pymChild.sendHeight();
  });

  selectItemsPerPage.addEventListener('change', e => {
    var numItems = e.target.value;
    list.page = numItems;
    updateRange();
    list.update();
  });

  function updatePaginationRange() {
    var numberOfPages = Math.ceil(list.matchingItems.length / list.page);
    var currentPage = paginationSelect.value;
    totalPages.innerHTML = numberOfPages;
    displayedPageNumber.innerHTML = currentPage;
  }

  function updateRange() {
    var numberOfItems = list.page;
    var displayedItemRange = document.querySelector(
      '[data-displayed-item-range]'
    );
    var range = +list.i + +numberOfItems - 1;
    if (range > list.matchingItems.length) {
      range = list.matchingItems.length;
    }
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
  pymChild.sendHeight();
}

var dataUrl =
  'https://s3.amazonaws.com/wola-cam//19dwn5dI7bjj0hS4SNY-uE-lfPq0NrbRMZh5p2ofU4Zo';

var localJson = '../data/data.json';
// Load the data.
d3.json(dataUrl, display);
