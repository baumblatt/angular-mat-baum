import {ActionReducerMap, createFeatureSelector} from '@ngrx/store';

export interface CoreState {
}

export const coreReducers: ActionReducerMap<CoreState> = {
};

export const getCoreState = createFeatureSelector<CoreState>(
	'core'
);
