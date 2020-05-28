import React, { useEffect } from "react";
import {
  Table,
  TablePagination,
  TableFooter,
  TableBody,
  TableCell,
  TableRow,
  FormControl,
  InputLabel,
  Input,
  Button,
  Paper
} from "@material-ui/core";
import { withRouter, Link } from "react-router-dom";
import { connect } from "react-redux";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import { first } from "lodash";
import { setSubjectSearchParams, searchSubjects } from "../../reducers/searchReducer";
import RegistrationMenu from "./RegistrationMenu";
import PrimaryButton from "../../components/PrimaryButton";
import { EnhancedTableHead, stableSort, getComparator } from "../../components/TableHeaderSorting";
import { TablePaginationActions } from "./SubjectSearchPagination";
import { useTranslation } from "react-i18next";
import { ToolTipContainer } from "../../components/ToolTipContainer";

const useStyle = makeStyles(theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing(3),
    overflowX: "auto",
    flexShrink: 0,
    marginLeft: theme.spacing(2.5)
  },
  table: {
    minWidth: 1000
  },
  searchCreateToolbar: {
    display: "flex"
  },
  searchForm: {
    marginLeft: theme.spacing(3),
    marginBottom: theme.spacing(8),
    display: "flex",
    alignItems: "flex-end",
    flex: 8
  },
  searchFormItem: {
    margin: theme.spacing(1)
  },
  searchBtnShadow: {
    boxShadow: "none",
    backgroundColor: "#0e6eff",
    marginRight: 10
  },
  createButtonHolder: {
    flex: 1
  },
  searchBox: {
    padding: "1.5rem",
    margin: "2rem 1rem"
  },
  cellpadding: {
    padding: "14px 40px 14px 0px"
  }
}));

const SubjectsTable = ({ type, subjects, pageDetails, searchparam }) => {
  const classes = useStyle();
  const { t } = useTranslation();
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("fullName");
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  let tableHeaderName = [];
  let subjectsListObj = [];
  let pageinfo = pageDetails.subjects;
  let searchText = searchparam;

  const camelize = str => {
    return (" " + str).toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function(match, chr) {
      return chr.toUpperCase();
    });
  };

  subjects &&
    subjects.map(a => {
      let firstName = a.firstName ? camelize(a.firstName) : "";
      let lastName = a.lastName ? camelize(a.lastName) : "";
      // let subjectType = a.subjectType.name;
      let sub = {
        uuid: a.uuid,
        fullName: firstName + " " + lastName,
        subjectType: a.subjectType.name,
        gender: a.gender ? t(a.gender.name) : "",
        dateOfBirth:
          new Date().getFullYear() - new Date(a.dateOfBirth).getFullYear() + " " + `${t("years")}`,
        addressLevel: a.addressLevel ? a.addressLevel.titleLineage : "",
        activePrograms: a.activePrograms ? a.activePrograms : ""
      };
      subjectsListObj.push(sub);
    });

  if (type.name === "Individual") {
    tableHeaderName = [
      { id: "fullName", numeric: false, disablePadding: true, label: "Name", align: "left" },
      {
        id: "subjectType",
        numeric: false,
        disablePadding: true,
        label: "subjectType",
        align: "left"
      },
      { id: "gender", numeric: false, disablePadding: true, label: "gender", align: "left" },
      {
        id: "dateOfBirth",
        numeric: true,
        disablePadding: false,
        label: "age",
        align: "left"
      },
      {
        id: "addressLevel",
        numeric: false,
        disablePadding: true,
        label: "addressVillage",
        align: "left"
      },
      {
        id: "activePrograms",
        numeric: false,
        disablePadding: true,
        label: "enrolments",
        align: "left"
      }
    ];
  } else {
    tableHeaderName = [
      { id: "fullName", numeric: false, disablePadding: true, label: "Name", align: "left" },
      {
        id: "addressLevel",
        numeric: false,
        disablePadding: true,
        label: "location",
        align: "left"
      },
      {
        id: "activePrograms",
        numeric: false,
        disablePadding: true,
        label: "activeprograms",
        align: "left"
      }
    ];
  }

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = event => {
    if (event.target.checked) {
      const newSelecteds = subjects.map(n => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    pageDetails.setSearchParams({ page: newPage, query: searchText, size: rowsPerPage });
    pageDetails.search();
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    pageDetails.setSearchParams({ page: 0, query: searchText, size: event.target.value });
    pageDetails.search();
  };

  const isSelected = name => selected.indexOf(name) !== -1;

  // const emptyRows = rowsPerPage - Math.min(rowsPerPage, subjectsListObj.length - rowsPerPage);

  return (
    subjectsListObj && (
      <div>
        <Table className={classes.table} aria-label="custom pagination table">
          <EnhancedTableHead
            headername={tableHeaderName}
            classes={classes}
            numSelected={selected.length}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            onRequestSort={handleRequestSort}
            rowCount={subjectsListObj.length}
          />
          <TableBody>
            {stableSort(subjectsListObj, getComparator(order, orderBy)).map((row, index) => {
              return (
                <TableRow key={row.fullName}>
                  <TableCell component="th" scope="row" padding="none" width="20%">
                    <Link to={`/app/subject?uuid=${row.uuid}`}>{row.fullName}</Link>
                  </TableCell>
                  <TableCell component="th" scope="row" padding="none" width="12%">
                    {row.subjectType}
                  </TableCell>
                  {type.name === "Individual" && (
                    <TableCell align="left" className={classes.cellpadding}>
                      {row.gender}
                    </TableCell>
                  )}
                  {type.name === "Individual" && (
                    <TableCell align="left" className={classes.cellpadding}>
                      {row.dateOfBirth}
                    </TableCell>
                  )}
                  <TableCell align="left" className={classes.cellpadding}>
                    {row.addressLevel}
                  </TableCell>
                  <TableCell align="left" width="25%" className={classes.cellpadding}>
                    {" "}
                    {row.activePrograms.map((p, key) => (
                      <Button
                        key={key}
                        size="small"
                        style={{
                          height: 20,
                          padding: 2,
                          margin: 2,
                          backgroundColor: p.colour,
                          color: "white",
                          fontSize: 11
                        }}
                        disabled
                      >
                        {t(p.operationalProgramName)}
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50, { label: "All", value: -1 }]}
                // component="div"
                // colSpan={3}
                search={searchText}
                count={pageinfo.totalElements}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    )
  );
};

const SubjectSearch = props => {
  const classes = useStyle();
  const { t } = useTranslation();
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [searchvalue, setSearchvalue] = React.useState("");

  const handleSubmit = event => {
    event.preventDefault();
    console.log("-------------->", event.target);
    props.search();
  };

  const valueSubmit = e => {
    props.setSearchParams({ page: 0, query: e.target.value, size: 10 });
    setSearchvalue(e.target.value);
    console.log("Serach value------>", e.target.value);
  };

  useEffect(() => {
    props.search();
    sessionStorage.clear("subject");
  }, []);

  return (
    props.subjects && (
      <Paper className={classes.searchBox}>
        <div className={classes.searchCreateToolbar}>
          <form onSubmit={handleSubmit} className={classes.searchForm}>
            <FormControl className={classes.searchFormItem}>
              <InputLabel htmlFor="search-field">{""}</InputLabel>
              <Input
                id="search-field"
                autoFocus
                type="text"
                value={props.searchParams.query}
                // onChange={e =>
                // props.setSearchParams({page:0,query:e.target.value,size:rowsPerPage})}
                onChange={valueSubmit}
              />
            </FormControl>
            <FormControl className={classes.searchFormItem}>
              <ToolTipContainer toolTipKey={t("searchHelpText")}>
                <PrimaryButton
                  type={"submit"}
                  onClick={handleSubmit}
                  className={classes.searchBtnShadow}
                >
                  {t("search")}
                </PrimaryButton>
              </ToolTipContainer>
            </FormControl>
          </form>
          <RegistrationMenu className={classes.createButtonHolder} />
        </div>
        <SubjectsTable
          subjects={props.subjects.content}
          type={props.subjectType}
          pageDetails={props}
          searchparam={searchvalue}
        />
      </Paper>
    )
  );
};

const mapStateToProps = state => {
  return {
    user: state.app.user,
    subjects: state.dataEntry.search.subjects,
    searchParams: state.dataEntry.search.subjectSearchParams,
    subjectType: first(state.dataEntry.metadata.operationalModules.subjectTypes)
  };
};

const mapDispatchToProps = {
  search: searchSubjects,
  setSearchParams: setSubjectSearchParams
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(SubjectSearch)
);
