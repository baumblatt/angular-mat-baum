import {
  apply,
  chain,
  externalSchematic,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from "@angular-devkit/schematics";
import {strings} from "@angular-devkit/core";
import {RunSchematicTask} from "@angular-devkit/schematics/tasks";
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";
import {createDefaultPath} from "@schematics/angular/utility/workspace";
import {Change, ReplaceChange} from "@schematics/angular/utility/change";
import {
  addImportToModule,
  addRouteDeclarationToModule as addRouteDeclarationToModuleStd,
  insertImport
} from "@schematics/angular/utility/ast-utils";
import {addMixin, addRouteDeclarationToModule, debug, getAngularSchematicsDefaults, makeChanges} from "../utils/utils";

export function factory(_options: Module): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    const name = strings.dasherize(_options.name);
    const modulePath = `${_options.path}/${name}/${name}.module.ts`;
    const moduleRouterPath = `${_options.path}/${name}/${name}-routing.module.ts`;

    debug(_options, 'Creating the feature module');

    return chain([

      // create the module using original Angular Schematics
      externalSchematic('@schematics/angular', 'module', {
        ..._options,
        ...getAngularSchematicsDefaults(_tree, _options.project as string)['@schematics/angular:module'],
        route: undefined,
        module: undefined,
        name: name,
        routing: true,
        routingScope: 'Child',
        flat: false,
      }),
      // add route declaration to core routing module
      (tree) => {
        // todo: maybe a different module than Core.
        debug(_options, 'Creating the route of feature module on core module.');
        const routingModule = `${_options.path}/core/core-routing.module.ts`;

        const source = ts.createSourceFile(
          routingModule,
          // @ts-ignore
          tree.read(routingModule).toString(),
          ts.ScriptTarget.Latest, true
        );

        const changes: Change[] = [addRouteDeclarationToModule(source, routingModule, name)];

        return makeChanges(tree, routingModule, changes);
      },
      // add the menu item on sidebar navigation of layout html
      (tree) => {
        // todo: maybe a different module than Core.
        debug(_options, 'Creating the link of feature module on layout container.');
        const layoutPath = `${_options.path}/core/containers/layout/layout.container.html`;
        const source: Buffer = tree.read(layoutPath) as Buffer;

        const matDivider = '<mat-divider></mat-divider>';

        const position = source.toString().lastIndexOf(matDivider);
        const contentToInsert = `<mat-divider></mat-divider>
                <mat-list-item (click)="close()" routerLink="/core/layout/${name}" routerLinkActive="active">
                    <mat-icon matListIcon>link</mat-icon>
                    <span>${strings.classify(name)}</span>
                </mat-list-item>
                <mat-divider></mat-divider>`;

        const changes: Change[] = [new ReplaceChange(layoutPath, position, matDivider, contentToInsert)]

        return makeChanges(tree, layoutPath, changes);
      },
      // create the feature store files from templates
      () => {
        debug(_options, 'Creating feature store.');
        return mergeWith(apply(url('./files/store'), [template({
          ..._options,
          ...strings,
          path: `${_options.path}/${name}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      // import store and effects modules from NgRx
      (tree) => {
        debug(_options, 'Initializing the store on feature module.');
        const source = ts.createSourceFile(
          modulePath,
          // @ts-ignore
          tree.read(modulePath).toString(),
          ts.ScriptTarget.Latest, true
        );

        const changes = addImportToModule(
          source,
          modulePath,
          `StoreModule.forFeature('${name}', ${strings.camelize(name)}Reducers)`,
          '@ngrx/store'
        );

        changes.push(...addImportToModule(
          source,
          modulePath,
          `SharedModule`,
          '../shared/shared.module'
        ));

        changes.push(insertImport(
          source,
          modulePath,
          `${strings.camelize(name)}Reducers`,
          './store/reducers/feature.reducer'
        ));

        return makeChanges(tree, modulePath, changes);
      },
      // create the store slice (if needed)
      () => {
        if (!!_options.slice) {
          debug(_options, 'Calling the slice schematic.');
          _context.addTask(new RunSchematicTask('slice', {
            name: _options.slice,
            path: `${_options.path}/${name}`,
          }));
        }
      },
      // add style
      () => {
        debug(_options, 'Creating the feature module style.');
        return mergeWith(apply(url('./files/style'), [template({
          ..._options,
          ...strings,
          path: `${_options.path}/${name}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      // call the style from module
      (tree) => {
        // todo: maybe a different module than Core.
        debug(_options, 'Adding the feature module style on core style.');
        const parentStylePath = `/${_options.path}/core/core.styles.scss`;

        const changes: Change[] = addMixin(
          tree,
          parentStylePath,
          `/${_options.path}/${name}/${name}.styles`,
          `${name}-theme`
        );

        return makeChanges(tree, parentStylePath, changes);
      },
      // add router
      (_tree) => {
        debug(_options, 'Add default redirect route to the entry component');

        const source = ts.createSourceFile(
          moduleRouterPath,
          _tree.read(moduleRouterPath)?.toString() || '',
          ts.ScriptTarget.Latest, true
        );

        const change = addRouteDeclarationToModuleStd(
          source,
          moduleRouterPath,
          `\n  {path: '', pathMatch: 'full', redirectTo: 'entry'},\n`,
        );

        return makeChanges(_tree, moduleRouterPath, [change]);
      },
      // create the entry component
      () => {
        debug(_options, 'Calling the entry component schematics.');
        _context.addTask(new RunSchematicTask('component', {
          name: 'entry',
          type: 'container',
          route: 'entry',
          path: `${_options.path}/${name}/containers`,
        }));
      }
    ]);
  }
}

