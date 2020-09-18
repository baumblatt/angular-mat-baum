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
import {Path, strings} from "@angular-devkit/core";
import * as ts from "typescript";
import {createDefaultPath} from "@schematics/angular/utility/workspace";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {addReducerToActionReducerMap, addReducerToStateInterface, debug, makeChanges} from "../utils/utils";
import {
  addImportToModule,
  insertImport
} from "../schematics-core";

export function factory(_options: Slice): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    const modulePath = findModuleFromOptions(_tree, _options) as Path;
    const moduleFile = modulePath.split('/').pop() || '';
    const feature = moduleFile.split('.').reverse().pop() || '';

    const name = strings.dasherize(_options.name);

    return chain([

      () => {
        debug(_options, 'Creating the slice actions, effects, reducers and selectors.');
        return mergeWith(apply(url('./files/store'), [template({
          ..._options,
          ...strings,
          feature,
          path: `${_options.path}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      (tree) => {
        debug(_options, 'Initializing the slice effects on feature module.');
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

        return makeChanges(tree, modulePath, changes);
      },
      (tree) => {
        debug(_options, 'Initializing the slice reduce on feature module reducer.');
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

        changes.push(addReducerToStateInterface(source, featureReducePath, name));
        changes.push(addReducerToActionReducerMap(source, featureReducePath, name));

        return makeChanges(tree, featureReducePath, changes)
      }
    ]);
  }
}
