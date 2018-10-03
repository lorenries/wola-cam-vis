import DataTableV2 from "carbon-components/es/components/data-table-v2/data-table-v2";
import { addCommas } from "./addCommas";
import List from "list.js";
import pymChild from "./pymChild";
import { english, spanish } from "./language";
import translations from "./translations";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

function pivotTable(data) {
  function rowTemplate(d) {
    var country = d.country;

    return `
    <tr class="bx--parent-row-v2" data-parent-row>
      <td class="bx--table-expand-v2" data-event="expand">
        <button class="bx--table-expand-v2__button">
          <svg class="bx--table-expand-v2__svg" width="7" height="12" viewBox="0 0 8 12" fill-rule="evenodd">
            <path d="M0 10.6L4.7 6 0 1.4 1.4 0l6.1 6-6.1 6z"></path>
          </svg>
        </button>
      </td>
      <td class="program">${d.program_name}</td>
      <td class="total" data-total="${d.total}">$${addCommas(d.total)}</td>
      <td class="year">${d.year}</td>
      <td class="category">${d.category}</td>
      <td class="country">${country}</td>
      <td class="description dn">${d.description ? d.description : null}</td>
      <td class="account">${d.account ? d.account : ""}</td>
    </tr>
    <tr class="bx--expandable-row-v2 bx--expandable-row--hidden-v2" data-child-row>
      <td colspan="8" class="pt2">
        <h4 class="f6">
          <strong>${
            english
              ? translations.description.eng
              : translations.description.esp
          }</strong>
        </h4>
        <p class="lh-title f6">${d.description ? d.description : `n/a`}</p>
      </td>
    </tr>
    `;
  }

  ["year", "category", "country", "account"].forEach(val => createFilters(val));

  function createFilters(key) {
    const uniques = data.reduce((acc, cur) => {
      if (!acc.includes(cur[key])) {
        acc.push(cur[key]);
      }
      return acc;
    }, []);

    const filterEl = document.querySelector(`#${key}-filter`);

    uniques.forEach((unique, i) => {
      const inner = `
      <input id="${key}-filter-${i}" checked class="bx--checkbox ${key}-filter" type="checkbox" value="${unique}" name="checkbox">
      <label for="${key}-filter-${i}" class="bx--checkbox-label">
        <span class="bx--checkbox-appearance">
          <svg class="bx--checkbox-checkmark" width="12" height="9" viewBox="0 0 12 9" fill-rule="evenodd">
            <path d="M4.1 6.1L1.4 3.4 0 4.9 4.1 9l7.6-7.6L10.3 0z"></path>
          </svg>
        </span>
        ${unique}
      </label>
    `;
      const newNode = document.createElement("li");
      newNode.classList.add("bx--toolbar-menu__option", "in-overflow");
      newNode.innerHTML = inner;
      filterEl.appendChild(newNode);
    });
  }

  d3.select("#table-body")
    .selectAll(".temp-wrapper")
    .data(data)
    .enter()
    .append("tbody")
    .classed("temp-wrapper", true)
    .html(rowTemplate);

  document.querySelectorAll("tbody.temp-wrapper").forEach(function(val) {
    while (val.firstChild) {
      val.parentNode.insertBefore(val.firstChild, val);
    }
    val.parentNode.removeChild(val);
  });

  const tableElement = document.querySelector("[data-table-v2]");
  const tableInstance = DataTableV2.create(tableElement);

  var options = {
    valueNames: [
      "program",
      { name: "total", attr: "data-total" },
      "year",
      "category",
      "country",
      "account",
      "description"
    ],
    page: 10
  };
  var list = new List("table", options);

  tableInstance.refreshRows();
  tableElement.addEventListener("data-table-v2-aftertoggleexpand", function(e) {
    pymChild.sendHeight();
  });

  var numberOfItems = document.querySelector("[data-total-items]");
  var selectItemsPerPage = document.querySelector("[data-items-per-page]");
  var forwardPaginationButton = document.querySelector("[data-page-forward]");
  var backwardPaginationButton = document.querySelector("[data-page-backward]");
  var paginationSelect = document.querySelector("[data-page-number-input]");
  var displayedPageNumber = document.querySelector(
    "[data-displayed-page-number]"
  );
  var totalPages = document.querySelector("[data-total-pages]");

  tippy("[data-overflow-menu]", {
    content: document.querySelector(".overflow-menu"),
    interactive: true,
    trigger: "click",
    distance: 0,
    performance: true,
    onShown() {
      const apply = document.querySelector(".filter-apply");
      apply.addEventListener("click", e => {
        e.preventDefault();
        document.querySelector("[data-overflow-menu]")._tippy.hide();
      });
      const reset = document.querySelector(".filter-reset");
      reset.addEventListener("click", e => {
        e.preventDefault();
        document.querySelectorAll(".bx--checkbox").forEach(checkbox => {
          checkbox.checked = true;
        });
        document.querySelector("[data-overflow-menu]")._tippy.hide();
      });
    },
    onHide() {
      setFilterState();
    }
  });
  const filter = {
    year: [],
    category: [],
    country: [],
    account: []
  };
  function setFilterState() {
    const yearFilters = document.querySelectorAll(".year-filter");
    const categoryFilters = document.querySelectorAll(".category-filter");
    const countryFilters = document.querySelectorAll(".country-filter");
    const accountFilters = document.querySelectorAll(".account-filter");
    filter.year = Array.from(yearFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    filter.category = Array.from(categoryFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    filter.country = Array.from(countryFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    filter.account = Array.from(accountFilters)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);

    list.filter(item => {
      const hasYear = filter.year.includes(item.values().year);
      const hasCategory = filter.category.includes(
        item.values().category.replace(/&amp;/g, "&")
      );
      const hasCountry = filter.country.includes(item.values().country);
      const hasAccount = filter.account.includes(
        item.values().account.replace(/&amp;/g, "&")
      );
      return hasYear && hasCountry && hasAccount && hasCategory;
    });
    list.update();
  }

  const search = document.querySelector(".search");

  search.addEventListener("input", e => {
    console.log(e);
    list.search(e.target.value);
    list.update();
  });

  function updatePagination() {
    var numberOfPages = Math.ceil(list.matchingItems.length / list.page);
    var range = document.createRange();
    range.selectNodeContents(paginationSelect);
    range.deleteContents();
    for (var i = 1; i <= numberOfPages; i++) {
      var option = document.createElement("option");
      option.classList.add("bx--select-option");
      option.setAttribute("value", i);
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

  forwardPaginationButton.addEventListener("click", function(e) {
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

  backwardPaginationButton.addEventListener("click", function(e) {
    if (paginationSelect.value != 1) {
      list.i = list.i - list.page;
      paginationSelect.selectedIndex--;
      list.show(list.i, list.page);
    }
  });

  // on select change
  // list.i = select value * list.page
  // table.show(list.i, list.page)

  paginationSelect.addEventListener("change", function(e) {
    list.i = (e.target.value - 1) * list.page + 1;
    list.show(list.i, list.page);
  });

  numberOfItems.innerHTML = list.matchingItems.length;
  updateRange();

  var numberOfPages = +numberOfItems.innerHTML / +selectItemsPerPage.value;

  list.on("updated", function(e) {
    numberOfItems.innerHTML = list.matchingItems.length;
    updateRange();
    updatePagination();
    updatePaginationRange();
    tableInstance.refreshRows();
    pymChild.sendHeight();
  });

  selectItemsPerPage.addEventListener("change", e => {
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
      "[data-displayed-item-range]"
    );
    var range = +list.i + +numberOfItems - 1;
    if (range > list.matchingItems.length) {
      range = list.matchingItems.length;
    }
    displayedItemRange.innerHTML = `${list.i}-${range}`;
  }
}

export default pivotTable;
