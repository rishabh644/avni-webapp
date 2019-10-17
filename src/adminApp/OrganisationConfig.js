import React, { useEffect, useState } from "react";
import { localeChoices } from "../common/constants";
import _, { isEmpty } from "lodash";
import axios from "axios";
import MaterialTable from "material-table";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import { Add, Edit } from "@material-ui/icons";
import { Title } from "react-admin";
import { default as UUID } from "uuid";

const useStyles = makeStyles({
  root: {
    width: "100%",
    overflowX: "auto"
  }
});

export const customConfig = ({ history }) => {
  const emptyOrgSettings = {
    uuid: UUID.v4(),
    settings: { languages: [], myDashboardFilters: [], searchFilters: [] }
  };

  const [settings, setSettings] = useState(emptyOrgSettings);
  const [concepts, setConcepts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [encounterTypes, setEncounterTypes] = useState([]);

  useEffect(_.noop, [settings]);

  useEffect(() => {
    axios.get("/organisationConfig").then(res => {
      const orgSettings = isEmpty(res.data._embedded.organisationConfig)
        ? emptyOrgSettings
        : res.data._embedded.organisationConfig[0];
      setSettings(orgSettings);
    });
  }, []);

  useEffect(() => {
    axios.get("/codedConcepts").then(res => {
      setConcepts(res.data);
    });
  }, []);

  useEffect(() => {
    axios.get("/web/programs").then(res => setPrograms(res.data));
  }, []);

  useEffect(() => {
    axios.get("/web/encounterTypes").then(res => setEncounterTypes(res.data));
  }, []);

  const styles = useStyles();

  const columns = [
    { title: "FilterName", field: "titleKey" },
    { title: "ConceptName", field: "conceptName" },
    { title: "SearchScope", field: "searchType" }
  ];

  const renderLanguage = languages => {
    return localeChoices
      .filter(locale => languages.includes(locale.id))
      .map(locale => `${locale.name}`)
      .join(", ");
  };

  const filterData = filters => {
    return _.isEmpty(concepts)
      ? filters
      : _.map(filters, filter => {
          filter["conceptName"] = _.find(concepts, c => c.uuid === filter.conceptUUID).name;
          return filter;
        });
  };

  const editFilter = filterType => ({
    icon: "edit",
    tooltip: "Edit Filter",
    onClick: (event, filter) => {
      history.push({
        pathname: "/filters",
        state: { filterType, selectedFilter: filter, concepts, programs, encounterTypes, settings }
      });
    }
  });

  const deleteFilter = filterType => ({
    icon: "delete_outline",
    onClick: (event, rowData) => {
      const voidedMessage = `Do you want to delete ${rowData.titleKey} filter ?`;
      if (window.confirm(voidedMessage)) {
        const filteredFilters = settings.settings[filterType].filter(
          f => f.titleKey !== rowData.titleKey
        );
        const newSettings = {
          uuid: settings.uuid,
          settings: {
            languages: settings.settings.languages,
            myDashboardFilters:
              filterType === "myDashboardFilters"
                ? filteredFilters
                : settings.settings.myDashboardFilters,
            searchFilters:
              filterType === "searchFilters" ? filteredFilters : settings.settings.searchFilters
          }
        };
        axios.post("/organisationConfig", newSettings).then(response => {
          if (response.status === 201) {
            setSettings(newSettings);
          }
        });
      }
    }
  });

  const addFilter = filterType => ({
    icon: "add_outline",
    tooltip: "Add Filter",
    isFreeAction: true,
    onClick: event => {
      history.push({
        pathname: "/filters",
        state: { filterType, selectedFilter: null, concepts, programs, encounterTypes, settings }
      });
    }
  });

  const editLanguage = () => (
    <IconButton
      label="Edit"
      onClick={() =>
        history.push({
          pathname: "/languages",
          state: { settings }
        })
      }
    >
      {_.isEmpty(settings.settings.languages) ? <Add /> : <Edit />}
    </IconButton>
  );

  const renderFilterTable = filterType => (
    <MaterialTable
      title={_.startCase(filterType)}
      columns={columns}
      data={filterData(settings.settings[filterType])}
      options={{ search: false, paging: false }}
      actions={[addFilter(filterType), deleteFilter(filterType), editFilter(filterType)]}
    />
  );

  return (
    <div>
      <Title title="Organisation Config" />
      <Paper className={styles.root}>
        <p />
        <div>
          <h6 className="MuiTypography-root MuiTypography-h6" style={{ marginLeft: 20 }}>
            Languages
          </h6>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center"
            }}
          >
            {editLanguage()}
            {renderLanguage(settings.settings.languages)}
          </div>
        </div>
        <p />
        {renderFilterTable("myDashboardFilters")}
        {renderFilterTable("searchFilters")}
      </Paper>
    </div>
  );
};
