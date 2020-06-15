import {ActionReducerMap, createFeatureSelector} from '@ngrx/store';

export interface <%= classify(name) %>State {

}

export const <%= camelize(name) %>Reducers: ActionReducerMap<<%= classify(name) %>State> = {};

export const get<%= classify(name) %>State = createFeatureSelector<<%= classify(name) %>State>(
  '<%= dasherize(name) %>'
);

