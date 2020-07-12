import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {sampleAction} from '../actions/<%= dasherize(name) %>.actions';
import {mapTo} from 'rxjs/operators';
import {onAlert} from '../../../core/store/actions/messages.actions';

@Injectable()
export class <%= classify(name) %>Effects {

  sampleAction$ = createEffect(() => this.actions$.pipe(
    ofType(sampleAction),
    mapTo(onAlert({message: 'This is the effect of the sample action of <%= name %> from <%= feature %>'}))
  ));


  constructor(private actions$: Actions) {
  }

}
