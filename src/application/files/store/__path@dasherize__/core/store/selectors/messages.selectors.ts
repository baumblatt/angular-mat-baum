import { createSelector } from '@ngrx/store';
import { getCoreState } from '../reducers/feature.reducer';

const getMessagesState = createSelector(
  getCoreState,
  state => state.messages
);

export const getLoadingDialogId = createSelector(
  getMessagesState,
  state => state.dialogId
);
