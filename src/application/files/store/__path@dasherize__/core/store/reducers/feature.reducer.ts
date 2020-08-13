import { ActionReducerMap, createFeatureSelector } from '@ngrx/store';
import { messagesReducer, MessagesState } from './messages.reducers';
import { preferencesReducer, PreferencesState } from "./preferences.reducers";

export interface CoreState {
	messages: MessagesState;
	preferences: PreferencesState
}

export const coreReducers: ActionReducerMap<CoreState> = {
	messages: messagesReducer,
	preferences: preferencesReducer
};

export const getCoreState = createFeatureSelector<CoreState>(
	'core'
);
