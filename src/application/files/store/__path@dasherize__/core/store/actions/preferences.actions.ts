import {createAction, props} from "@ngrx/store";

export const setTheme = createAction(
  '[core:preferences] Set Theme',
  props<{ theme: 'light' | 'dark' }>(),
);

export const toggleTheme = createAction(
  '[core:preferences] Toggle Theme',
);
