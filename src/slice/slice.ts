import {
  apply,
  chain,
  MergeStrategy,
  mergeWith,
  Rule,
  SchematicContext, template,
  Tree,
  url
} from "@angular-devkit/schematics";
import {getProjectPath} from "@ngrx/schematics/schematics-core";
import {strings} from "@angular-devkit/core";

export function factory(_options: Slice): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {

    _options.path = getProjectPath(_tree, _options);

    return chain([

      () => {
        return mergeWith(apply(url('./files/store'), [template({
          ..._options,
          ...strings,
          path: `${_options.path}`
        })]), MergeStrategy.AllowCreationConflict);
      },


    ]);
  }
}
