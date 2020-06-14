import {Action, createReducer, on} from "@ngrx/store";
import { setTheme, toggleTheme } from "../actions/preferences.actions";

export interface PreferencesState {
  theme?: 'light' | 'dark'
}

export const initialState: PreferencesState = {};

const reducer = createReducer<PreferencesState, Action>(
  initialState,
  on(setTheme, (state, {theme}) => ({...state, theme})),
  on(toggleTheme, (state) => ({
    ...state,
    theme: state.theme === 'dark' ? 'light' : 'dark'
  })),
);

export function preferencesReducer(state: PreferencesState | undefined, action: Action): PreferencesState {
  return reducer(state, action);
}
