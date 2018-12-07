import React from "react";
import DataTable from "./DataTable";
import { english, spanish } from "./language";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

const Checkbox = props => (
  <li className="bx--toolbar-menu__option">
    <input
      checked={props.checked}
      id={slugify(props.val)}
      className="bx--checkbox"
      type="checkbox"
      name="checkbox"
      onChange={e => props.onChange(e, props.val)}
    />
    <label htmlFor={slugify(props.val)} className="bx--checkbox-label">
      <span className="bx--checkbox-appearance">
        <svg
          className="bx--checkbox-checkmark"
          width="12"
          height="9"
          viewBox="0 0 12 9"
          fillRule="evenodd"
        >
          <path d="M4.1 6.1L1.4 3.4 0 4.9 4.1 9l7.6-7.6L10.3 0z" />
        </svg>
      </span>
      {props.val}
    </label>
  </li>
);

export default class DataTableTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.years = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["year"])) {
        acc.push(cur["year"]);
      }
      return acc;
    }, []);
    this.categories = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["category"])) {
        acc.push(cur["category"]);
      }
      return acc;
    }, []);
    this.countries = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["country"])) {
        acc.push(cur["country"]);
      }
      return acc;
    }, []);
    this.accounts = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["account"])) {
        acc.push(cur["account"]);
      }
      return acc;
    }, []);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
  }

  handleCheckboxChange(e, val) {
    this.props.onFilterChange(val, e.target.checked);
  }

  render() {
    return (
      <div className="flex flex-wrap">
        <div className="w-100 flex flex-wrap">
          <ul className="list pl0 w-30-l w-100" id="year-filter">
            <li className="bx--toolbar-menu__title">
              {spanish ? "FILTRAR DATOS POR AÑO" : "FILTER BY YEAR"}
            </li>
            {this.years.map(val => (
              <Checkbox
                val={val}
                onChange={this.handleCheckboxChange}
                checked={this.props.filter[val]}
                key={slugify(val)}
              />
            ))}
          </ul>
          <ul className="list pl0 w-70-l w-100" id="category-filter">
            <li className="bx--toolbar-menu__title">
              {spanish ? "FILTRAR DATOS POR CATEGORÍA" : "FILTER BY CATEGORY"}
            </li>
            {this.categories.map(val => (
              <Checkbox
                val={val}
                onChange={this.handleCheckboxChange}
                checked={this.props.filter[val]}
                key={slugify(val)}
              />
            ))}
          </ul>
        </div>
        <div className="w-100 flex flex-wrap">
          <ul className="list pl0 w-30-l w-100" id="country-filter">
            <li className="bx--toolbar-menu__title">
              {spanish ? "FILTRAR DATOS POR PAÍS" : "FILTER BY COUNTRY"}
            </li>
            {this.props.countries.map(val => {
              return (
                <Checkbox
                  val={val}
                  onChange={this.handleCheckboxChange}
                  checked={this.props.filter[val]}
                  key={slugify(val)}
                />
              );
            })}
          </ul>
          <ul className="list pl0 w-70-l w-100" id="account-filter">
            <li className="bx--toolbar-menu__title">
              {spanish
                ? "FILTRAR DATOS POR FUENTE DE FINANCIAMIENTO"
                : "FILTER BY FUNDING ACCOUNT"}
            </li>
            {this.accounts.map(val => (
              <Checkbox
                val={val}
                onChange={this.handleCheckboxChange}
                checked={this.props.filter[val]}
                key={slugify(val)}
              />
            ))}
          </ul>
        </div>
        <button
          className="filter-apply bx--btn bx--btn--primary ml3 mr3"
          type="button"
          onClick={this.props.onApply}
        >
          {spanish ? "Aplicar" : "Apply"}
        </button>
        <button
          className="filter-reset bx--btn bx--btn--secondary mb3"
          type="button"
          onClick={this.props.onReset}
        >
          {spanish ? "Reiniciar" : "Reset"}
        </button>
      </div>
    );
  }
}
