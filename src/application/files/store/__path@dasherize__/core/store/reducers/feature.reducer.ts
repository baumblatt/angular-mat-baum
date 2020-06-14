import {ActionReducerMap, createFeatureSelector} from '@ngrx/store';
import {preferencesReducer, PreferencesState} from "./preferences.reducers";

export interface CoreState {
	preferences: PreferencesState
}

export const coreReducers: ActionReducerMap<CoreState> = {
	preferences: preferencesReducer
};

export const getCoreState = createFeatureSelector<CoreState>(
	'core'
);
