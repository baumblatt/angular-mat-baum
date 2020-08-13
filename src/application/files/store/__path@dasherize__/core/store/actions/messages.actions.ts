import {createAction, props} from '@ngrx/store';

export const onInfo = createAction(
    '[core:message] Information',
    props<{ message: string}>(),
);

export const onAlert = createAction(
    '[core:message] Alert',
    props<{ message: string}>(),
);

export const onWarn = createAction(
    '[core:message] Warning',
    props<{ message: string, error?: any }>(),
);

export const onError = createAction(
    '[core:message] Error',
    props<{ error: any }>(),
);

export const showLoading = createAction(
  '[core:message] Show Loading',
  props<{ message: string }>(),
);

export const showLoadingSuccess = createAction(
  '[core:message] Show Loading Success',
  props<{ dialogId: string }>(),
);

export const hideLoading = createAction(
  '[core:message] Hide Loading',
);

export const hideLoadingSuccess = createAction(
  '[core:message] Hide Loading Success',
);
