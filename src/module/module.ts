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
import * as ts from "typescript";
import {createDefaultPath} from "@schematics/angular/utility/workspace";
import {Change, InsertChange, ReplaceChange} from "@schematics/angular/utility/change";
import {
  addImportToModule,
  findNodes,
  getRouterModuleDeclaration,
  insertImport
} from "@schematics/angular/utility/ast-utils";
import {addMixin, debug, getAngularSchematicsDefaults, makeChanges} from "../utils/utils";

export function factory(_options: Module): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    const name = strings.dasherize(_options.name);

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

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
          `${_options.path}/${name}/${name}.module.ts`,
          // @ts-ignore
          tree.read(`${_options.path}/${name}/${name}.module.ts`).toString(),
          ts.ScriptTarget.Latest, true
        );

        const changes = addImportToModule(
          source,
          `${_options.path}/${name}/${name}.module.ts`,
          `StoreModule.forFeature('${name}', ${strings.camelize(name)}Reducers)`,
          '@ngrx/store'
        );

        changes.push(...addImportToModule(
          source,
          `${_options.path}/${name}/${name}.module`,
          `SharedModule`,
          '../shared/shared.module'
        ));

        changes.push(insertImport(
          source,
          `${_options.path}/${name}/${name}.module.ts`,
          `${strings.camelize(name)}Reducers`,
          './store/reducers/feature.reducer'
        ));

        return makeChanges(tree, `${_options.path}/${name}/${name}.module.ts`, changes);
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
      // create the entry component
      () => {
        debug(_options, 'Calling the entry component schematics.');
        _context.addTask(new RunSchematicTask('component', {
          name: 'entry',
          type: 'container',
          path: `${_options.path}/${name}/containers`,
        }));
      }
    ]);
  }
}

/**
 * Adds a new route declaration to a router module (i.e. has a RouterModule declaration)
 */
export function addRouteDeclarationToModule(
  source: ts.SourceFile,
  fileToAdd: string,
  name: string,
): Change {
  const loadChildren = `() => import('../${name}/${name}.module').then(m => m.${strings.classify(name)}Module)`;
  const routeLiteral = `{path: '${name}', loadChildren: ${loadChildren}}`

  const routerModuleExpr = getRouterModuleDeclaration(source);
  if (!routerModuleExpr) {
    throw new Error(`Couldn't find a route declaration in ${fileToAdd}.`);
  }
  const scopeConfigMethodArgs = (routerModuleExpr as ts.CallExpression).arguments;
  if (!scopeConfigMethodArgs.length) {
    const { line } = source.getLineAndCharacterOfPosition(routerModuleExpr.getStart());
    throw new Error(
      `The router module method doesn't have arguments ` +
      `at line ${line} in ${fileToAdd}`,
    );
  }

  let routesArr: ts.ArrayLiteralExpression | undefined;
  const routesArg = scopeConfigMethodArgs[0];

  // Check if the route declarations array is
  // an in lined argument of RouterModule or a standalone variable
  if (ts.isArrayLiteralExpression(routesArg)) {
    routesArr = routesArg;
  } else {
    const routesVarName = routesArg.getText();
    let routesVar;
    if (routesArg.kind === ts.SyntaxKind.Identifier) {
      routesVar = source.statements
        .filter(ts.isVariableStatement)
        .find((v) => {
          return v.declarationList.declarations[0].name.getText() === routesVarName;
        });
    }

    if (!routesVar) {
      const { line } = source.getLineAndCharacterOfPosition(routesArg.getStart());
      throw new Error(
        `No route declaration array was found that corresponds ` +
        `to router module at line ${line} in ${fileToAdd}`,
      );
    }

    routesArr = findNodes(routesVar, ts.SyntaxKind.ArrayLiteralExpression, 1)[0] as ts.ArrayLiteralExpression;
  }

  const occurrencesCount = routesArr.elements.length;

  let route: string = routeLiteral;
  let insertPos = routesArr.elements.pos;

  if (occurrencesCount > 0) {

    const layoutRouteLiteral = routesArr.elements.find(element => {
      return ts.isObjectLiteralExpression(element) && element
        .properties.some(n => (
          ts.isPropertyAssignment(n)
          && ts.isIdentifier(n.name)
          && n.name.text === 'path'
          && ts.isStringLiteral(n.initializer)
          && n.initializer.text === 'layout'
        ));
    }) as ts.ObjectLiteralExpression;

    if (layoutRouteLiteral) {
      const layoutChildrenRouteLiteral = layoutRouteLiteral.properties
        .find(property => ts.isPropertyAssignment(property)
          && ts.isIdentifier(property.name)
          && property.name.text === 'children'
          && ts.isArrayLiteralExpression(property.initializer)
        ) as ts.PropertyAssignment;

      if (layoutChildrenRouteLiteral) {
        routesArr = layoutChildrenRouteLiteral.initializer as ts.ArrayLiteralExpression;
      }
    }

    const lastRouteLiteral = [...routesArr.elements].pop() as ts.Expression;
    const lastRouteIsWildcard = ts.isObjectLiteralExpression(lastRouteLiteral)
      && lastRouteLiteral
        .properties
        .some(n => (
          ts.isPropertyAssignment(n)
          && ts.isIdentifier(n.name)
          && n.name.text === 'path'
          && ts.isStringLiteral(n.initializer)
          && n.initializer.text === '**'
        ));

    const text = routesArr.getFullText(source);
    const indentation = text.match(/\r?\n(\r?)\s*/) || [];
    const routeText = `${indentation[0] || ' '}${routeLiteral}`;

    // Add the new route before the wildcard route
    // otherwise we'll always redirect to the wildcard route
    if (lastRouteIsWildcard) {
      insertPos = lastRouteLiteral.pos;
      route = `${routeText},`;
    } else {
      insertPos = lastRouteLiteral.end;
      route = `,${routeText}`;
    }
  }

  return new InsertChange(fileToAdd, insertPos, route);
}
