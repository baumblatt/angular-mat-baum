import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { LoadingDialog } from '../../components/loading/loading.dialog';
import { hideLoading, hideLoadingSuccess, onAlert, onInfo, onWarn, showLoading, showLoadingSuccess } from '../actions/messages.actions';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { CoreState } from '../reducers/feature.reducer';
import { getLoadingDialogId } from '../selectors/messages.selectors';

@Injectable()
export class MessagesEffects {

    onInfo$ = createEffect(() => this.actions$.pipe(
      ofType(onInfo),
      tap(({message}) => {
        this.matSnackBar.open(message, undefined, {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'center',
            panelClass: ['mat-snack-bar-primary'],
        });
      }),
    ), {dispatch: false});

    onAlert$ = createEffect(() => this.actions$.pipe(
      ofType(onAlert),
      tap(({message}) => {
        this.matSnackBar.open(message, undefined, {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'center',
            panelClass: ['mat-snack-bar-accent'],
        });
      }),
    ), {dispatch: false});

    onWarn$ = createEffect(() => this.actions$.pipe(
      ofType(onWarn),
      tap(({message}) => this.matSnackBar.open(message, undefined, {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
        panelClass: ['mat-snack-bar-warn'],
      })),
    ), {dispatch: false});

    showLoading$ = createEffect(() => this.actions$.pipe(
      ofType(showLoading),
      withLatestFrom(this.store.pipe(select(getLoadingDialogId))),
      filter(([, dialogId]) => !dialogId),
      map(([{message}]) => this.dialog.open(LoadingDialog, {
        closeOnNavigation: true,
        disableClose: true,
        data: message
      }).id),
      map((dialogId) => showLoadingSuccess({dialogId})),
    ));

    hideLoading$ = createEffect(() => this.actions$.pipe(
      ofType(hideLoading),
      withLatestFrom(this.store.pipe(select(getLoadingDialogId))),
      filter(([, dialogId]) => !!dialogId),
      tap(([, dialogId]) => {
        this.dialog.getDialogById(dialogId ?? '')?.close();
      }),
      map(() => hideLoadingSuccess()),
    ));

    constructor(private actions$: Actions, private dialog: MatDialog, private matSnackBar: MatSnackBar
                , private store: Store<CoreState>) {
    }

}
