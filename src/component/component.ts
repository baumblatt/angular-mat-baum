import {chain, externalSchematic, Rule, SchematicContext, Tree} from "@angular-devkit/schematics";
// import {strings} from "@angular-devkit/core";
import {createDefaultPath} from "@schematics/angular/utility/workspace";
import {getAngularSchematicsDefaults} from "../utils/utils";

export function factory(_options: Component): Rule {
  return async (_tree: Tree, _context: SchematicContext) => {
    if (!_options.project) {
      _options = {..._options,
        path: 'projects/my-test-drive/src/app/core',
        project: 'my-test-drive',
      };
    }

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    // const name = strings.dasherize(_options.name);

    return chain([
      // create the component using original Angular Schematics
      externalSchematic('@schematics/angular', 'component', {
        ..._options,
        ...getAngularSchematicsDefaults(_tree, _options.project as string)['@schematics/angular:component'],
        changeDetection: 'OnPush',
        displayBlock: false,
        inlineStyle: false,
        inlineTemplate: false,
      })
    ]);
  }
}
