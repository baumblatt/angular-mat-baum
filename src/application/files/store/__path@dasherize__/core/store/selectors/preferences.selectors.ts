import {createSelector} from "@ngrx/store";
import {getCoreState} from "../reducers/feature.reducer";

const getPreferencesState = createSelector(
  getCoreState,
  state => state.preferences
);

export const getPreferencesTheme = createSelector(
  getPreferencesState,
  state => state.theme
);
