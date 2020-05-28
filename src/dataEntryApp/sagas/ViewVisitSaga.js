import { all, call, fork, put, takeLatest } from "redux-saga/effects";
import { types, setEncounter } from "../reducers/viewVisitReducer";
import { mapEncounter, mapProgramEncounter } from "../../common/subjectModelMapper";
import { getSubjectProfile } from "../reducers/subjectDashboardReducer";
import api from "../api";

export default function*() {
  yield all([programEncounterFetchWatcher, encounterFetchWatcher].map(fork));
}

export function* programEncounterFetchWatcher() {
  yield takeLatest(types.GET_PROGRAM_ENCOUNTER, programEncounterFetchWorker);
}

export function* programEncounterFetchWorker({ encounterUuid }) {
  const encounter = yield call(api.fetchProgramEncounter, encounterUuid);
  yield put(getSubjectProfile(encounter.subjectUUID));
  yield put(setEncounter(mapProgramEncounter(encounter)));
}

export function* encounterFetchWatcher() {
  yield takeLatest(types.GET_ENCOUNTER, encounterFetchWorker);
}

export function* encounterFetchWorker({ encounterUuid }) {
  const encounter = yield call(api.fetchEncounter, encounterUuid);
  yield put(getSubjectProfile(encounter.subjectUUID));
  yield put(setEncounter(mapEncounter(encounter)));
}
