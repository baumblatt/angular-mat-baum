export function createCustomTheme (name = 'app') {
  return `
@use '@angular/material' as mat;
// Custom Theming for Angular Material by angular-mat-baum
// For more information: https://material.angular.io/guide/theming
// Plus imports for other components in your app.
@import 'app/material/material.styles';
@import 'app/core/core.styles';

// Include the common styles for Angular Material. We include this here so that you only
// have to load a single css file for Angular Material in your app.
// Be sure that you only ever include this mixin once!
@include mat.core();

// Define the palettes for your theme using the Material Design palettes available in palette.scss
// (imported above). For each palette, you can optionally specify a default, lighter, and darker
// hue. Available color palettes: https://material.io/design/color/
$${name}-light-primary: mat.define-palette(mat.$deep-purple-palette);
$${name}-light-accent: mat.define-palette(mat.$amber-palette, A200, A100, A400);
$${name}-dark-primary: mat.define-palette(mat.$pink-palette, 700, 500, 900);
$${name}-dark-accent: mat.define-palette(mat.$blue-grey-palette, A200, A100, A400);

// The warn palette is optional (defaults to red).
$${name}-warn: mat.define-palette(mat.$red-palette);

// Create the theme object (a Sass map containing all of the palettes).
$${name}-light-theme: mat.define-light-theme((
  color: (
    primary: $${name}-light-primary,
    accent: $${name}-light-accent,
    warn: $${name}-warn,
  )
));
$${name}-dark-theme: mat.define-dark-theme((
  color: (
    primary: $${name}-dark-primary,
    accent: $${name}-dark-accent,
    warn: $${name}-warn,
  )
));

// Include theme styles for core and each component used in your app.
// Alternatively, you can import and @include the theme mixins for each component
// that you are using.
body.app-light-theme {
  @include mat.all-component-themes($${name}-light-theme);
  @include material-ext-theme($${name}-light-theme);
  @include core-theme($${name}-light-theme);
}
body.app-dark-theme {
  @include mat.all-component-themes($${name}-dark-theme);
  @include material-ext-theme($${name}-dark-theme);
  @include core-theme($${name}-dark-theme);
}

/* You can add global styles to this file, and also import other style files */

html, body { height: 100%; }
body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }  
  `;
}
