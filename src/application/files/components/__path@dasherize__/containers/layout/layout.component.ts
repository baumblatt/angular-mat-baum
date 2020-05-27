import { MediaMatcher } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

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
                media: MediaMatcher, private router: Router) {

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
        this.theme$ = of('light').pipe(
            tap(color => {
                if (color === 'dark' || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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
