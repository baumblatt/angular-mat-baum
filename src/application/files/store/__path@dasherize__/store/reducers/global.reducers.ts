import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';

export interface AppState {
    router: RouterReducerState;
}

export const reducers: ActionReducerMap<AppState> = {
    router: routerReducer
};


export const metaReducers: MetaReducer<AppState>[] = [];
