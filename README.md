# The Baum Project

This is a strongly opinionated Angular Application Schematic using NgRx, Angular Flex Layout and Angular Material.

# Getting Started With The Baum Schematic

Create a new angular project without an Application, install the schematic and generate your `Baum App`.

```
ng new my-workspace --createApplication=false
cd my-workspace
ng add angular-mat-baum my-app
ng serve --open=true
```

## The list of Schematics available

### add

Add the library to your project, this schematic will install dependencies and run `App` schematic.

how to use:
```
ng add angular-mat-baum [app-name]
```
*stage*: ready to use

### Component

Create a new component, that could be a container, a dialog or just a simple component.

how to use:
```
ng g angular-mat-baum:component component-name [--type container|component|dialog]
```
> You can use almost all core Angular component options. 

*stage*: early stage, needs attention and extra works, may generate inconsistent code.

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
