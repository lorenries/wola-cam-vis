import React from "react";
import ReactTable from "react-table";
import Pagination from "./Pagination";
import DataTableTooltip from "./DataTableTooltip";
import Tippy from "@tippy.js/react";
import { format } from "d3";
import { english, spanish } from "./language";
import "tippy.js/dist/tippy.css";
import "react-table/react-table.css";
import pymChild from "./pymChild";

const Description = row => {
  console.log(row);
  return (
    <div className="description">
      <h1 style={{ fontSize: "0.875rem" }}>Description</h1>
      <p style={{ lineHeight: "1.3" }}>{row.original.description}</p>
    </div>
  );
};

export default class DataTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { search: "", filter: {} };
    this.years = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["year"])) {
        acc.push(cur["year"]);
        this.state.filter[cur["year"]] = true;
      }
      return acc;
    }, []);
    this.categories = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["category"])) {
        acc.push(cur["category"]);
        this.state.filter[cur["category"]] = true;
      }
      return acc;
    }, []);
    this.countries = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["country"])) {
        acc.push(cur["country"]);
        this.state.filter[cur["country"]] = true;
      }
      return acc;
    }, []);
    this.accounts = this.props.data.reduce((acc, cur) => {
      if (!acc.includes(cur["account"])) {
        acc.push(cur["account"]);
        this.state.filter[cur["account"]] = true;
      }
      return acc;
    }, []);
    this.handleSearch = this.handleSearch.bind(this);
    this.onApply = this.onApply.bind(this);
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onReset = this.onReset.bind(this);
    this.tip = null;
  }

  componentDidMount() {
    pymChild.sendHeight();
  }

  componentDidUpdate() {
    pymChild.sendHeight();
  }

  handleSearch(e) {
    this.setState({ search: e.target.value });
  }

  onApply() {
    this.tip.hide();
  }

  onFilterChange(id, val) {
    console.log(id, val);
    this.setState(prevState => ({
      filter: {
        ...prevState.filter,
        [id]: val
      }
    }));
  }

  onReset() {
    const newFilter = {};
    Object.keys(this.state.filter).forEach(val => (newFilter[val] = true));
    this.setState({ filter: { ...newFilter } });
  }

  render() {
    const { search, filter } = this.state;
    console.log(filter);
    const { data } = this.props;
    let _data = data.filter(row => {
      return (
        filter[row.year] &&
        filter[row.category] &&
        filter[row.country] &&
        filter[row.account]
      );
    });
    if (search.length > 0) {
      _data = _data.filter(row => {
        const columns = Object.keys(row);
        return columns.some(
          column =>
            typeof row[column] === "string" &&
            row[column].toLowerCase().includes(search.toLowerCase())
        );
      });
    }
    const columns = [
      { Header: "", expander: true, accessor: "description" },
      {
        Header: spanish ? "Programa" : "Program",
        accessor: "program_name",
        width: 250
      },
      {
        Header: "Total",
        accessor: "total",
        width: 150,
        Cell: cell => format("$,")(+cell.value)
      },
      { Header: spanish ? "Año" : "Year", accessor: "year", width: 100 },
      { Header: spanish ? "Categoría" : "Category", accessor: "category" },
      { Header: spanish ? "País" : "Country", accessor: "country", width: 150 },
      {
        Header: spanish ? "Fuente de Financiamiento" : "Funding Account",
        accessor: "account"
      }
    ];
    return (
      <div style={{ paddingTop: "1rem" }}>
        <div>
          <h4 className="bx--data-table-v2-header">
            {spanish ? "Todos los Programas" : "All Programs"}
          </h4>
          <div className="bx--table-toolbar">
            <div className="bx--toolbar-search-container">
              <div
                data-search
                className="bx--search bx--search--sm"
                role="search"
              >
                <svg
                  className="bx--search-magnifier"
                  width={16}
                  height={16}
                  viewBox="0 0 16 16"
                  fillRule="evenodd"
                >
                  <path d="M6 2c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zm0-2C2.7 0 0 2.7 0 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zM16 13.8L13.8 16l-3.6-3.6 2.2-2.2z" />
                  <path d="M16 13.8L13.8 16l-3.6-3.6 2.2-2.2z" />
                </svg>
                <label
                  id="search-input-label-10"
                  className="bx--label"
                  htmlFor="search__input-10"
                >
                  Search
                </label>
                <input
                  className="bx--search-input search"
                  type="text"
                  id="search__input-10"
                  role="search"
                  placeholder={spanish ? "Buscar" : "Search"}
                  aria-labelledby="search-input-label-10"
                  onChange={this.handleSearch}
                />
                <svg
                  className="bx--search-close bx--search-close--hidden"
                  width={10}
                  height={10}
                  viewBox="0 0 10 10"
                  fillRule="evenodd"
                >
                  <path d="M9.8 8.6L8.4 10 5 6.4 1.4 10 0 8.6 3.6 5 .1 1.4 1.5 0 5 3.6 8.6 0 10 1.4 6.4 5z" />
                </svg>
              </div>
            </div>
            <div
              className="w-auto flex items-center"
              aria-label="List of options"
            >
              <Tippy
                trigger="click"
                content={
                  <DataTableTooltip
                    data={data}
                    onApply={this.onApply}
                    onReset={this.onReset}
                    onFilterChange={this.onFilterChange}
                    filter={this.state.filter}
                  />
                }
                interactive={true}
                onCreate={tip => (this.tip = tip)}
                placement="bottom"
              >
                <div className="pl3 f7 flex items-center link dark-gray">
                  <svg
                    className="bx--overflow-menu__icon bx--toolbar-filter-icon w1 h-auto dark-gray"
                    viewBox="0 0 16 12"
                    style={{ fill: "#333" }}
                  >
                    <g fillRule="nonzero">
                      <path d="M8.05 2a2.5 2.5 0 0 1 4.9 0H16v1h-3.05a2.5 2.5 0 0 1-4.9 0H0V2h8.05zm2.45 2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3.05 9a2.5 2.5 0 0 1 4.9 0H16v1H7.95a2.5 2.5 0 0 1-4.9 0H0V9h3.05zm2.45 2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                    </g>
                  </svg>
                  <span className="pl1">
                    {spanish ? "Filtrar Datos" : "Filtering options"}
                  </span>
                </div>
              </Tippy>
            </div>
            <a
              id="download-data"
              className="pl3 f7 flex items-center link dark-gray"
              href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSO236d-Xyzqh0oRWb4hPzyGXHj0Is8UyFpEvsRJuB0Lm-HjGKkiFlMfgCHSYITmhdg6VPObX_Kq9wO/pub?gid=0&single=true&output=csv"
            >
              <svg
                className="w1 h1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1={12} y1={15} x2={12} y2={3} />
              </svg>{" "}
              <span className="pl1">
                {spanish ? "Descargar Información" : "Download Data"}
              </span>
            </a>
          </div>
        </div>
        <ReactTable
          data={_data}
          columns={columns}
          PaginationComponent={Pagination}
          SubComponent={Description}
          className="-highlight"
        />
      </div>
    );
  }
}
