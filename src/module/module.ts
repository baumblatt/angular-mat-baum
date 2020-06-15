import {
  apply,
  chain,
  externalSchematic, MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext, template,
  Tree,
  url
} from "@angular-devkit/schematics";
import {addImportToModule, getProjectPath, InsertChange, insertImport} from "@ngrx/schematics/schematics-core";
import {strings} from "@angular-devkit/core";
import {RunSchematicTask} from "@angular-devkit/schematics/tasks";
import * as ts from "typescript";

export function factory(_options: Module): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    const name = strings.dasherize(_options.name);

    _options.path = getProjectPath(_tree, _options);

    return chain([

      externalSchematic('@schematics/angular', 'module', {
        ..._options,
        name: name,
        routing: true
      }),
      () => {
        return mergeWith(apply(url('./files/store'), [template({
          ..._options,
          ...strings,
          path: `${_options.path}/${name}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      (tree) => {
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

        changes.push(insertImport(
          source,
          `${_options.path}/${name}/${name}.module.ts`,
          `${strings.camelize(name)}Reducers`,
          './store/reducers/feature.reducer'
        ));

        const recorder = tree.beginUpdate(`${_options.path}/${name}/${name}.module.ts`);

        for (const change of changes) {
          if (change instanceof InsertChange) {
            recorder.insertLeft(change.pos, change.toAdd);
          }
        }

        tree.commitUpdate(recorder);

        return tree;

      },
      () => {
        if (!!_options.slice) {
          _context.addTask(new RunSchematicTask('slice', {
            name: _options.slice,
            feature: name,
            path: `${_options.path}/${strings.dasherize(name)}`,
          }));
        }
      }
    ]);
  }
}
