import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { CoreState } from "../../store/reducers/feature.reducer";
import { select, Store } from "@ngrx/store";
import { setTheme, toggleTheme } from "../../store/actions/preferences.actions";
import { getPreferencesTheme } from "../../store/selectors/preferences.selectors";


@Component({
  selector: '<%= prefix %>-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit {

  /**
   * Reference to the sidenav component.
   */
  @ViewChild('sidenav', {static: false})
  sidenav: MatSidenav;

  /**
   * Observable of the theme user preference.
   */
  theme$: Observable<string>;

  /**
   * Flag to indicate if the sidenav is opened.
   */
  opened = false;

  /**
   * The media query result of mobile view.
   */
  mobileQuery: MediaQueryList;

  /**
   * Change detector for mobile query..
   */
  private readonly mobileQueryListener: () => void;

  constructor(changeDetectorRef: ChangeDetectorRef, @Inject(DOCUMENT) private document: Document,
              media: MediaMatcher, private router: Router, private store: Store<CoreState>) {

    this.mobileQuery = media.matchMedia('(max-width: 959px)');
    this.mobileQueryListener = () => changeDetectorRef.detectChanges();

    try {
      this.mobileQuery.addEventListener('change', this.mobileQueryListener);
    } catch (e) {
      // safari
      this.mobileQuery.addListener(this.mobileQueryListener);
    }
  }

  ngOnInit() {
    this.theme$ = this.store.pipe(
      select(getPreferencesTheme),
      filter(color => {
        if (!color && (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          this.store.dispatch(setTheme({theme: 'dark'}));
        }
        return !!color;
      }),
      tap(color => {
        if (color === 'dark') {
          this.document.body.className = 'app-dark-theme';
        } else {
          this.document.body.className = 'app-light-theme';
        }
      })
    );
  }

  close() {
    this.opened = false;
  }

  theme() {
    this.store.dispatch(toggleTheme());
  }

  toggle() {
    this.opened = !this.opened;
  }

  async closeAndGo(url: string) {
    if (this.mobileQuery.matches) {
      await this.sidenav.close();
    }
    await this.router.navigateByUrl(url);
  }
}
