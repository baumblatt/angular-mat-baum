import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {onInfo, onAlert, onWarn} from '../actions/msg.actions';
import {tap} from 'rxjs/operators';

@Injectable()
export class MsgEffects {

    onInfo$ = createEffect(() => this.actions$.pipe(
        ofType(onInfo),
        tap(({message}) => {
            this.matSnackBar.open(message, null, {
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
            this.matSnackBar.open(message, null, {
                duration: 3000,
                verticalPosition: 'bottom',
                horizontalPosition: 'center',
                panelClass: ['mat-snack-bar-accent'],
            });
        }),
    ), {dispatch: false});

    onWarn$ = createEffect(() => this.actions$.pipe(
        ofType(onWarn),
        tap(({message}) => this.matSnackBar.open(message, null, {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'center',
            panelClass: ['mat-snack-bar-warn'],
        })),
    ), {dispatch: false});

    constructor(private actions$: Actions, private matSnackBar: MatSnackBar) {
    }

}
