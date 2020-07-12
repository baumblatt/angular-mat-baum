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
import {createDefaultPath, getWorkspace} from "@schematics/angular/utility/workspace";
import {addMixin, getAngularSchematicsDefaults, makeChanges} from "../utils/utils";
import {Path, strings} from "@angular-devkit/core";
import {findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {parseName} from "@schematics/angular/utility/parse-name";

export function factory(_options: Component): Rule {


  return async (_tree: Tree, _context: SchematicContext) => {
    if (!_options.path) {
      _options = {..._options,
        path: 'projects/my-test-drive/src/app/core',
        project: 'my-test-drive',
      };
    }

    const workspace = await getWorkspace(_tree);
    const project = workspace.projects.get(_options.project as string);

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    const modulePath = findModuleFromOptions(_tree, _options) as Path;
    // const moduleFile = modulePath.split('/').pop() || '';
    // const moduleName = moduleFile.split('.').reverse().pop() || '';

    const parsedPath = parseName(_options.path as string, _options.name);
    _options.name = parsedPath.name;
    _options.path = parsedPath.path;
    _options.selector = _options.selector || buildSelector(_options, project && project.prefix || '');

    const name = strings.dasherize(_options.name);

    return chain([
      // create the component using original Angular Schematics
      externalSchematic('@schematics/angular', 'component', {
        ..._options,
        ...getAngularSchematicsDefaults(_tree, _options.project as string)['@schematics/angular:component'],
        changeDetection: 'OnPush',
        displayBlock: false,
        inlineStyle: false,
        inlineTemplate: false,
      }),
      // insert template files based on type
      () => {
        return mergeWith(apply(url(`./files/${_options.type}`), [template({
          ..._options,
          ...strings,
          path: `${_options.path}/${name}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      // add style
      (_tree) => {
        const parentStylePath = `${modulePath.split('.').reverse().pop()}.styles.scss`;

        const changes = addMixin(
          _tree,
          parentStylePath,
          `/${_options.path}/${name}/${name}.${_options.type}.theme`
        );

        return makeChanges(_tree, parentStylePath, changes);
      }
      // the container specific steps
      // the dialog specific steps
    ]);
  }
}

function buildSelector(options: Component, projectPrefix: string) {
  let selector = strings.dasherize(options.name);
  if (options.prefix) {
    selector = `${options.prefix}-${selector}`;
  } else if (options.prefix === undefined && projectPrefix) {
    selector = `${projectPrefix}-${selector}`;
  }

  return selector;
}
