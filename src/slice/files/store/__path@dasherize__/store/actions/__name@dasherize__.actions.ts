import {createAction, props} from '@ngrx/store';

export const sampleAction = createAction(
  '[<%= feature %>:<%= name %>] Sample action',
  props<{ anything: string }>(),
);


