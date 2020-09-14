# The Baum Project

A strongly opinionated Angular Application Schematic using NgRx, Angular Flex Layout and Angular Material.

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
ng g angular-mat-baum:component components/juices --type dialog
ng g angular-mat-baum:component components/cadies-detail --type bottom-sheet
```

### Compatibility Table

| CLI    | Typescript | Baum               |
|:-------|:----------:|:------------------:|
| 10.0.x |  ~3.9.5    | <= 1.0.0-beta.13   |         
| 10.1.x |  ~4.0.2    | 1.0.0-beta.14 over |

> Please, choose the Angular Baum version as compatibility table above.

## The list of Schematics available

### add

Add the library to your project, this schematic will install dependencies and run `App` schematic.

how to use:
```
ng add angular-mat-baum [app-name]
```
*stage*: almost finished.

### Component

Create a new component, that could be a container, a dialog, a bottom-sheet or just a simple component.

how to use:
```
ng g angular-mat-baum:component component-name [--type container|component|dialog|bottom-sheet]
```
> You can use almost all core Angular component options. 

*stage*: almost finished.

### module

Add a new module to an application

how to use:
```
ng g angular-mat-baum:module module-name
```

> You can use almost all core Angular module options.

*stage*: almost finished.

### slice

Create a new slice in the store feature.

how to use:
```
ng g angular-mat-baum:slice [slice-name] [--name slice-name]
```
*stage*: almost finished.

That's all, enjoy it!
