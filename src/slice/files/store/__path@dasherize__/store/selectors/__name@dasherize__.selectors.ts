import {createSelector} from "@ngrx/store";
import {get<%= classify(feature) %>State} from '../reducers/feature.reducer';

const get<%= classify(name) %>State = createSelector(
  get<%= classify(feature) %>State,
  state => state.<%= camelize(name) %>
)
