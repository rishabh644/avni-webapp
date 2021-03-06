import { FormControl, FormLabel, makeStyles } from "@material-ui/core";
import React from "react";
import api from "../reports/api";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import ScreenWithAppBar from "../common/components/ScreenWithAppBar";
import { getOperationalModules, getUploadStatuses } from "./reducers";
import JobStatus from "./JobStatus";
import Paper from "@material-ui/core/Paper";
import _ from "lodash";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import Box from "@material-ui/core/Box";
import { DateSelector } from "./DateSelector";
import { ExportOptions } from "./ExportOptions";
import { sideBarOptions } from "./ReportUtils";
import ReportTypes from "./ReportTypes";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "../dataEntryApp/components/Radio";
import { DocumentationContainer } from "../common/components/DocumentationContainer";
import AddressLevelsByType from "../common/components/AddressLevelsByType";

const useStyles = makeStyles(theme => ({
  root: {},
  button: {
    color: "#3f51b5"
  }
}));

const Export = ({
  operationalModules,
  getOperationalModules,
  getUploadStatuses,
  exportJobStatuses
}) => {
  const classes = useStyles();

  React.useEffect(() => {
    getOperationalModules();
  }, []);

  const currentDate = new Date();
  const [reportType, setReportType] = React.useState({});
  const [selectedSubjectType, setSelectedSubjectType] = React.useState({});
  const [selectedProgram, setSelectedProgram] = React.useState({});
  const [selectedEncounterType, setSelectedEncounterType] = React.useState({});
  const [startDate, setStartDate] = React.useState(currentDate);
  const [endDate, setEndDate] = React.useState(currentDate);
  const [addressLevelsIds, setAddressLevelsIds] = React.useState([]);
  const [addressLevelError, setAddressLevelError] = React.useState();

  const resetAllParams = () => {
    setSelectedSubjectType({});
    setSelectedProgram({});
    setSelectedEncounterType({});
    setStartDate(currentDate);
    setEndDate(currentDate);
  };

  const dateParamsRequired = () => reportType.name === ReportTypes.getName("All");

  const onStartExportHandler = async () => {
    const request = {
      subjectTypeUUID: selectedSubjectType.uuid,
      programUUID: selectedProgram.uuid,
      encounterTypeUUID: selectedEncounterType.uuid,
      startDate: dateParamsRequired() ? startDate.setHours(0, 0, 0, 0) : null,
      endDate: dateParamsRequired() ? endDate.setHours(23, 59, 59, 999) : null,
      reportType: ReportTypes.getCode(reportType.name),
      addressLevelIds: addressLevelsIds
    };
    const [ok, error] = await api.startExportJob(request);
    if (!ok && error) {
      alert(error);
    }
    setTimeout(() => getUploadStatuses(0), 1000);
  };

  const onReportTypeChangeHandler = type => {
    setReportType(type);
    resetAllParams();
  };

  const renderProgramsAndEncounters = (programs, encounters) => {
    return (
      <>
        <ExportOptions
          options={programs}
          label={"Program"}
          selectedOption={selectedProgram}
          onChange={setSelectedProgram}
        />
        <ExportOptions
          options={encounters}
          label={"Encounter Type"}
          selectedOption={selectedEncounterType}
          onChange={setSelectedEncounterType}
        />
      </>
    );
  };

  const renderProgramOrEncounters = () => {
    const { programs, formMappings, encounterTypes } = operationalModules;
    const validFormMappingsForSelectedSubject = formMappings.filter(
      fm => fm.subjectTypeUUID === selectedSubjectType.uuid
    );
    const validPrograms = _.intersectionWith(
      programs,
      validFormMappingsForSelectedSubject,
      (a, b) => a.uuid === b.programUUID
    );
    if (_.isEmpty(validPrograms)) {
      const validEncounters = _.intersectionWith(
        encounterTypes,
        validFormMappingsForSelectedSubject,
        (a, b) => a.uuid === b.encounterTypeUUID
      );
      return (
        <ExportOptions
          options={validEncounters}
          label={"Encounter Types"}
          selectedOption={selectedEncounterType}
          onChange={setSelectedEncounterType}
        />
      );
    } else {
      const validFormMappingsForSelectedProgram = formMappings.filter(
        fm => fm.programUUID === selectedProgram.uuid
      );
      const validEncounters = _.intersectionWith(
        encounterTypes,
        validFormMappingsForSelectedProgram,
        (a, b) => a.uuid === b.encounterTypeUUID
      );
      return renderProgramsAndEncounters(validPrograms, validEncounters);
    }
  };

  const onSubjectTypeChange = option => {
    setSelectedProgram({});
    setSelectedEncounterType({});
    setSelectedSubjectType(option);
  };

  const renderAddressLevel = () => {
    return (
      <Grid container direction={"row"}>
        <Grid item xs={12}>
          <AddressLevelsByType
            addressLevelsIds={addressLevelsIds}
            setAddressLevelsIds={setAddressLevelsIds}
            setError={setAddressLevelError}
          />
        </Grid>
        <Grid item xs={12}>
          <div style={{ color: "red", marginBottom: "10px" }}>{addressLevelError}</div>
        </Grid>
      </Grid>
    );
  };

  const subjectTypes = () => {
    return (
      <ExportOptions
        options={operationalModules.subjectTypes}
        label={"Subject Type"}
        selectedOption={selectedSubjectType}
        onChange={onSubjectTypeChange}
      />
    );
  };

  const renderAllTypes = () => {
    return (
      <Grid>
        {subjectTypes()}
        {renderProgramOrEncounters()}
        {!_.isEmpty(selectedEncounterType) && (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <Grid container direction="row" justify="flex-start">
              <DateSelector label={"Visit start date"} value={startDate} onChange={setStartDate} />
              <DateSelector label={"Visit end date"} value={endDate} onChange={setEndDate} />
            </Grid>
          </MuiPickersUtilsProvider>
        )}
      </Grid>
    );
  };

  const ReportOptions = () => {
    return (
      <FormControl component="fieldset">
        <FormLabel component="legend">Report Type</FormLabel>
        <FormGroup row>
          {ReportTypes.names.map(type => (
            <FormControlLabel
              key={type.name}
              control={
                <Radio
                  checked={type.name === reportType.name}
                  onChange={() => onReportTypeChangeHandler(type)}
                  value={type.name}
                />
              }
              label={type.name}
            />
          ))}
        </FormGroup>
      </FormControl>
    );
  };

  const enableReportGeneration = () => {
    switch (reportType.name) {
      case ReportTypes.getName("Registration"):
        return !_.isEmpty(selectedSubjectType);
      case ReportTypes.getName("All"):
        return !_.isEmpty(selectedEncounterType);
      default:
        return false;
    }
  };

  return (
    <ScreenWithAppBar
      appbarTitle={`Longitudinal Export`}
      enableLeftMenuButton={true}
      sidebarOptions={sideBarOptions}
    >
      {operationalModules && (
        <div>
          <Box border={1} mb={2} borderColor={"#ddd"} p={2}>
            <DocumentationContainer filename={"Report.md"}>
              <Grid>
                <ReportOptions />
                {reportType.name === ReportTypes.getName("Registration") && subjectTypes()}
                {reportType.name === ReportTypes.getName("All") && renderAllTypes()}
                {!_.isEmpty(reportType.name) && renderAddressLevel()}
              </Grid>
              <Grid container direction="row" justify="flex-start">
                <Button
                  variant="contained"
                  color="primary"
                  aria-haspopup="false"
                  onClick={onStartExportHandler}
                  disabled={!enableReportGeneration()}
                  className={classes.item}
                >
                  Generate Export
                </Button>
              </Grid>
            </DocumentationContainer>
          </Box>
          <Grid item>
            <Paper style={{ marginBottom: 100 }}>
              <JobStatus
                exportJobStatuses={exportJobStatuses}
                operationalModules={operationalModules}
              />
            </Paper>
          </Grid>
        </div>
      )}
    </ScreenWithAppBar>
  );
};

const mapStateToProps = state => ({
  operationalModules: state.reports.operationalModules,
  exportJobStatuses: state.reports.exportJobStatuses
});

export default withRouter(
  connect(
    mapStateToProps,
    { getOperationalModules, getUploadStatuses }
  )(Export)
);
