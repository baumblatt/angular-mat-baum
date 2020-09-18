import {Tree} from "@angular-devkit/schematics";
import {
  applyToUpdateRecorder,
  Change,
  InsertChange,
  NoopChange,
  ReplaceChange
} from "@schematics/angular/utility/change";
import {buildRelativePath} from "@schematics/angular/utility/find-module";
import ts = require("typescript");
import {strings} from "@angular-devkit/core";
import {InsertChange as InsertChange2, ReplaceChange as ReplaceChange2} from "../schematics-core";


export const debug = (options: {verbose?: boolean}, message: string) => {
  if (options.verbose) {
    console.log(message);
  } else {
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
