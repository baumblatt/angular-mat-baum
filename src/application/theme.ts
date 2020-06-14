return `
// Custom Theming for Angular Material
// For more information: https://material.angular.io/guide/theming
@import '~@angular/material/theming';
// Plus imports for other components in your app.
@import 'app/material/styles';
@import 'app/core/styles';

// Include the common styles for Angular Material. We include this here so that you only
// have to load a single css file for Angular Material in your app.
// Be sure that you only ever include this mixin once!
@include mat-core();

// Define the palettes for your theme using the Material Design palettes available in palette.scss
// (imported above). For each palette, you can optionally specify a default, lighter, and darker
// hue. Available color palettes: https://material.io/design/color/
$${name}-primary: mat-palette($mat-indigo);
$${name}-accent: mat-palette($mat-pink, A200, A100, A400);

// The warn palette is optional (defaults to red).
$${name}-warn: mat-palette($mat-red);

// Create the theme object (a Sass map containing all of the palettes).
$${name}-light-theme: mat-light-theme($${name}-primary, $${name}-accent, $${name}-warn);
$${name}-dark-theme: mat-dark-theme($${name}-primary, $${name}-accent, $${name}-warn);

// Include theme styles for core and each component used in your app.
// Alternatively, you can import and @include the theme mixins for each component
// that you are using.
body.app-light-theme {
  @include angular-material-theme($${name}-light-theme);
  @include material-ext-theme($${name}-light-theme);
  @include core-theme($${name}-light-theme);
}
body.app-dark-theme {
  @include angular-material-theme($${name}-dark-theme);
  @include material-ext-theme($${name}-dark-theme);
  @include core-theme($${name}-dark-theme);
}

/* You can add global styles to this file, and also import other style files */

html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }  
  `;
export function createCustomTheme (name = 'app') {
}
