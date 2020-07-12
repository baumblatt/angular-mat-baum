import {Action, createReducer} from '@ngrx/store';

export interface <%= classify(name) %>State {

}

export const initialState: <%= classify(name) %>State = {};

const reducer = createReducer<<%= classify(name) %>State, Action>(
  initialState,
  // ...ons: On<<%= classify(name) %>State>()

);

export function <%= camelize(name) %>Reducer(state: <%= classify(name) %>State | undefined, action: Action): <%= classify(name) %>State {
  return reducer(state, action);
}
