import {createAction, props} from '@ngrx/store';

export const onInfo = createAction(
    '[App] Information',
    props<{ message: string}>(),
);

export const onAlert = createAction(
    '[App] Alert',
    props<{ message: string}>(),
);

export const onWarn = createAction(
    '[App] Warning',
    props<{ message: string, error?: any }>(),
);

export const onError = createAction(
    '[App] Error',
    props<{ error: any }>(),
);

