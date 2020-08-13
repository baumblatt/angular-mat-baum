import { Action, createReducer, on } from '@ngrx/store';
import { hideLoadingSuccess, showLoadingSuccess } from '../actions/messages.actions';

export interface MessagesState {
  dialogId?: string;
}

export const initialState: MessagesState = {};

const reducer = createReducer<MessagesState, Action>(
  initialState,
  on(showLoadingSuccess, ((state, {dialogId}) => ({...state, dialogId}))),
  on(hideLoadingSuccess, state => {
   const {dialogId, ...rest} = state;
   return rest;
  }),
);

export function messagesReducer(state: MessagesState | undefined, action: Action): MessagesState {
  return reducer(state, action);
}
