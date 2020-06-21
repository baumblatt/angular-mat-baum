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

> how to use:
```
ng add angular-mat-baum [app-name] [--name app-name]
```
*stage*: ready to use

### module

Add a new module to an application
> how to use:
```
ng g angular-mat-baum:module [module-name] [--name module-name]
```
*stage*: almost finished, needs extra work after use it.

### slice

Create a new slice in the store feature.
> how to use
```
ng g angular-mat-baum:slice [slice-name] [--name slice-name]
```
*stage*: early stage, needs attention and extra works, may generate inconsistent code.

That's all, enjoy it!
