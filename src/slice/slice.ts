import {
  apply,
  chain,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from "@angular-devkit/schematics";
import {addImportToModule, InsertChange, insertImport} from "@ngrx/schematics/schematics-core";
import {Path, strings} from "@angular-devkit/core";
import * as ts from "typescript";
import {createDefaultPath} from "@schematics/angular/utility/workspace";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {Change, NoopChange} from "@schematics/angular/utility/change";

function addReducerToStateInterface(source: ts.SourceFile, reducersPath: string, name: string): Change {
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

function  addReducerToActionReducerMap(): Change {
  return new NoopChange();
}

export function factory(_options: Slice): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    const modulePath = findModuleFromOptions(_tree, _options) as Path;
    const feature = 'fruits';

    const name = strings.dasherize(_options.name);

    return chain([

      () => {
        return mergeWith(apply(url('./files/store'), [template({
          ..._options,
          ...strings,
          feature,
          path: `${_options.path}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      (tree) => {
        const source = ts.createSourceFile(
          modulePath,
          // @ts-ignore
          tree.read(modulePath).toString(),
          ts.ScriptTarget.Latest, true
        );

        const changes = addImportToModule(
          source,
          modulePath,
          `EffectsModule.forFeature([${strings.classify(_options.name)}Effects])`,
          `@ngrx/effects`
        );

        changes.push(insertImport(
          source,
          modulePath,
          `${strings.classify(_options.name)}Effects`,
          `./store/effects/${name}.effects`
        ));

        const recorder = tree.beginUpdate(modulePath);

        for (const change of changes) {
          if (change instanceof InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
          }
        }
        tree.commitUpdate(recorder);

        return tree;
      },
      (tree) => {
        const featureReducePath = `${_options.path}/store/reducers/feature.reducer.ts`;

        const source = ts.createSourceFile(
          featureReducePath,
          // @ts-ignore
          tree.read(featureReducePath).toString(),
          ts.ScriptTarget.Latest, true
        );

        const changes = [];

        changes.push(insertImport(
          source,
          modulePath,
          `${strings.camelize(_options.name)}Reducer, ${strings.classify(_options.name)}State`,
          `./${name}.reducers`
        ));

        changes.push(addReducerToStateInterface(source, `${_options.path}/${strings.camelize(name)}.reducers`, name));
        changes.push(addReducerToActionReducerMap());

        const recorder = tree.beginUpdate(featureReducePath);

        for (const change of changes) {
          if (change instanceof InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
          }
        }
        tree.commitUpdate(recorder);

        return tree;
      }
    ]);
  }
}
