import {Tree} from "@angular-devkit/schematics";
import {
  applyToUpdateRecorder,
  Change,
  InsertChange,
  NoopChange,
  ReplaceChange
} from "@schematics/angular/utility/change";
import {buildRelativePath} from "@schematics/angular/utility/find-module";
import {strings} from "@angular-devkit/core";
import {InsertChange as InsertChange2, ReplaceChange as ReplaceChange2} from "../schematics-core";
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";
import {findNodes, getRouterModuleDeclaration} from "@schematics/angular/utility/ast-utils";


export const debug = (options: {verbose?: boolean}, message: string) => {
  if (options.verbose) {
    console.log(message);
  }
}

export const getAngularSchematicsDefaults = (tree: Tree, project: string) => {
  if (tree.exists('angular.json')) {
    const sourceText = tree.read('angular.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    return json.projects[project].schematics;
  }
}

export const addMixin = (tree: Tree, stylePath: string, mixinPath: string, mixin: string) => {
  const stylePathContent = tree.read(stylePath)?.toString() || '';

  const relativePath = buildRelativePath(stylePath, mixinPath);
  const styleLines = stylePathContent.split('\n');

  const indentation = (stylePathContent.match(/^([ \t]+)@include/) || [undefined, '  '])[1];

  return [new InsertChange(
    stylePath,
    styleLines.reduce((acc: number, cur: string) => {
      return cur.startsWith('@import') ? acc + cur.length + 1 : acc;
    }, 0),
    `@import "${relativePath}";\n`
  ), new InsertChange(
    stylePath,
    styleLines.reduce((acc: number, cur: string) => {
      return cur.startsWith('@mixin') || cur.indexOf('@include') > -1 ? acc + cur.length + 1 : acc;
    }, stylePathContent.indexOf('@mixin')),
    `${indentation}@include ${mixin}($theme);\n`
  )];
}

export const addMethod = (source: ts.SourceFile, componentPath: string, method: string) => {
  const componentClass = source.statements.find(
    (stm: any) => stm.kind === ts.SyntaxKind.ClassDeclaration
  ) as ts.ClassDeclaration;

  const end = componentClass.end;

  return new InsertChange(componentPath, end - 2, method);
}

const reviewChanges = (changes: Change[]): Change[] => {
  return changes.map(change => {
    if (change instanceof InsertChange2) {
      return new InsertChange(change.path, change.pos, change.toAdd);
    } else if (change instanceof ReplaceChange2) {
      return new ReplaceChange(change.path, change.pos, change.oldText, change.newText);
    }

    return change;
  });
}

export const makeChanges = (tree: Tree, path: string, changes: Change[]) => {
  const recorder = tree.beginUpdate(path);
  applyToUpdateRecorder(recorder, reviewChanges(changes));
  tree.commitUpdate(recorder);
  return tree;
}

export const addReducerToStateInterface = (source: ts.SourceFile, reducersPath: string, name: string): Change => {
  const stateInterface = source.statements.find(
    (stm) => stm.kind === ts.SyntaxKind.InterfaceDeclaration
  );
  let node = stateInterface as ts.Statement;

  if (!node) {
    return new NoopChange();
  }

  const keyInsert = `${strings.camelize(name)}: ${strings.classify(name)}State;`;

  const expr = node as any;
  let position;
  let toInsert;

  if (expr.members.length === 0) {
    position = expr.getEnd() - 1;
    toInsert = `  ${keyInsert}\n`;
  } else {
    node = expr.members[expr.members.length - 1];
    position = node.getEnd() + 1;
    // Get the indentation of the last element, if any.
    const text = node.getFullText(source);
    const matches = text.match(/^\r?\n+(\s*)/);

    if (matches!.length > 0) {
      toInsert = `${matches![1]}${keyInsert}\n`;
    } else {
      toInsert = `\n${keyInsert}`;
    }
  }

  return new InsertChange(reducersPath, position, toInsert);
}

export const addReducerToActionReducerMap = (source: ts.SourceFile, reducersPath: string, name: string): Change => {
  const actionReducerMap: any = source.statements
    .filter((stm) => stm.kind === ts.SyntaxKind.VariableStatement)
    .filter((stm: any) => !!stm.declarationList)
    .map((stm: any) => {
      const { declarations }: { declarations: ts.SyntaxKind.VariableDeclarationList[] } = stm.declarationList;

      const variable: any = declarations.find(
        (decl: any) => decl.kind === ts.SyntaxKind.VariableDeclaration
      );
      const type = variable ? variable.type : {};

      return { initializer: variable.initializer, type };
    })
    .filter((initWithType) => initWithType.type !== undefined)
    .find(({ type }) => type.typeName.text === 'ActionReducerMap');

  if (!actionReducerMap || !actionReducerMap.initializer) {
    return new NoopChange();
  }

  let node = actionReducerMap.initializer;

  const keyInsert = `${strings.camelize(name)}: ${strings.camelize(name)}Reducer,`;

  const expr = node as any;
  let position;
  let toInsert;

  if (expr.properties.length === 0) {
    position = expr.getEnd() - 1;
    toInsert = `  ${keyInsert}\n`;
  } else {
    node = expr.properties[expr.properties.length - 1];
    position = node.getEnd() + 1;
    // Get the indentation of the last element, if any.
    const text = node.getFullText(source);
    const matches = text.match(/^\r?\n+(\s*)/);

    if (matches.length > 0) {
      toInsert = `\n${matches![1]}${keyInsert}`;
    } else {
      toInsert = `\n${keyInsert}`;
    }
  }

  return new InsertChange(reducersPath, position, toInsert);
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
    const {line} = source.getLineAndCharacterOfPosition(routerModuleExpr.getStart());
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
      const {line} = source.getLineAndCharacterOfPosition(routesArg.getStart());
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
