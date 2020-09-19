# The Baum Project

A strongly opinionated Angular Application Schematic using NgRx, Angular Flex Layout and Angular Material.

# The Showroom

See the result of this project in action:
- The application on [https://angular-mat-baum.web.app](https://angular-mat-baum.web.app)
- The source code on [https://github.com/baumblatt/angular-mat-baum-showroom](https://github.com/baumblatt/angular-mat-baum-showroom)

# Getting started with the Baum schematics

Create a new Angular project without an application and add `angular-mat-baum` to generate your `Baum App`.

```
ng new my-baum-wks --createApplication=false
cd my-baum-wks
ng add angular-mat-baum my-baum-app
ng serve --open=true
```

Go further with your `Baum App`, create a future `module`, a second `slice`, two `containers`, one `dialog` and one `bottom-sheet.

```
cd projects/my-baum-app/src/app
ng g angular-mat-baum:module fruits --slice juices
cd fruits
ng g angular-mat-baum:slice candies
ng g angular-mat-baum:component containers/juices --type container
ng g angular-mat-baum:component containers/cadies --type container
ng g angular-mat-baum:component components/juices-detail --type dialog
ng g angular-mat-baum:component components/cadies-detail --type bottom-sheet
```

### Compatibility Table

| CLI    | Typescript | Baum               |
|:-------|:----------:|:------------------:|
| 10.0.x |  ~3.9.5    | <= 1.0.0-beta.13   |         
| 10.1.x |  ~4.0.2    | 1.0.0-beta.14 over |

> Please, choose the Angular Baum version as compatibility table above.

## The `angular-mat-baum` Schematics

### Add

Add the library to your project, this schematic will install dependencies and run `Application` schematic.

how to use:
```
ng add angular-mat-baum [app-name]
```

### Application

Create an Angular application in angular-mat-baum opinionated style. 

This schematic will create an application with
4 modules (App, Core, Shared, Material), A layout component with Material SideNav and Angular Flex Layout, 
Light and Dark Material themes, NgRx Store configured with Router State and DevTools and a few actions and effects like
Loading and Snack Bars.

#### how to use:
```
ng g angular-mat-baum:app [app-name]
```

#### Flavors:

| Option    | Description                                                 |
|:----------|:------------------------------------------------------------|
| name      | The name of the your application.                           |
| prefix    | A prefix to apply to generated selectors.                   |
| skipTests | When true, does not create `spec.ts` test files for the app.|

### Component

Creates a new component definition in the given or default project.

The component could be a container that will have the module store injected on your constructor, 
an Angular Material dialog, an Angular Material bottom sheet or just a simple component. All type of component
will have an Angular Material scss theme imported under correspond module.

#### Flavors:

| Option    | Description                                                 |
|:----------|:------------------------------------------------------------|
| name      | The name of the component.                                  |
| path      | The path at which to create the component file, relative to the current workspace. Default is a folder with the same name as the component in the project root..                   |
| project   | The name of the project.                                    |
| viewEncapsulation   | The view encapsulation strategy to use in the new component. |
| prefix    | The prefix to apply to the generated component selector.    |
| type      | Define each kind of component to be created, use `component`, `container`, `dialog` or `bottom-sheet`. |
| skipTests | When true, does not create `spec.ts` test files for the app.|
| selector  | The HTML selector to use for this component.                |
| skipSelector| Specifies if the component should have a selector or not. |
| module    | The declaring NgModule.                                     |
| export    | When true, the declaring NgModule exports this component.   |
| lintFix   | When true, applies lint fixes after generating the component.|

how to use:
```
ng g angular-mat-baum:component component-name [--type container|component|dialog|bottom-sheet]
```

### Module

Create a feature module in angular-mat-baum opinionated style.

This module will have an equivalent router module, a NgRx feature store, an entry component of type `container`,
an Angular Material scss theme file that will be imported on Core module style and will be used to import the module
components.

Optionally the module store can be created with a store `slice` using the same option name, please see `slice` schematic for more details. 

how to use:
```
ng g angular-mat-baum:module module-name
```

#### Flavors:

| Option    | Description                                                 |
|:----------|:------------------------------------------------------------|
| name      | The name of the NgModule.                                   |
| path      | The path at which to create the NgModule, relative to the workspace root. |
| project   | The name of the project.                                    |
| lintFix   | When true, applies lint fixes after generating the module.  |
| slice     | When present, create a slice of the Store with this name.   |

### Slice

Creates a new Store slice in angular-mat-baum opinionated style.

A Slice Store is a set of actions, effects, reducers and selectors that will tied under an action reducer map entry of
the feature module state. 

how to use:
```
ng g angular-mat-baum:slice [slice-name] [--name slice-name]
```

#### Flavors:

| Option    | Description                                                 |
|:----------|:------------------------------------------------------------|
| name      | The name of the slice of the store feature.                 |
| path      | The path used to find the NgModule, relative to the workspace root. |
| project   | The name of the project.                                    |
