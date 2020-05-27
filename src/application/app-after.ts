import {strings} from '@angular-devkit/core';
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
} from '@angular-devkit/schematics';
import {createCustomTheme} from "./theme";

export function factory(_options: App): Rule {
	return (_tree: Tree, _context: SchematicContext) => {

		const {name} = _options;

		return chain([
			externalSchematic('@angular/material', 'ng-add', {
				project: name,
				animations: true,
				theme: 'custom',
				typography: true
			}),

			externalSchematic('@schematics/angular', 'module', {
				name: 'shared',
				module: 'core/core.module',
				path: `projects/${name}/src/app`,
			}),
			externalSchematic('@schematics/angular', 'module', {
				name: 'material',
				module: 'shared/shared.module',
				path: `projects/${name}/src/app`,
			}),
			externalSchematic('@schematics/angular', 'component', {
				project: name,
				name: 'containers/layout',
				path: `projects/${name}/src/app/core`,
				style: 'scss',
				skipTests: _options.skipTests
			}),
			externalSchematic('@schematics/angular', 'component', {
				project: name,
				name: 'containers/home',
				path: `projects/${name}/src/app/core`,
				style: 'scss',
				skipTests: _options.skipTests
			}),
			() => {
				return mergeWith(apply(url('./files/modules'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},			() => {
				return mergeWith(apply(url('./files/styles'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			() => {
				return mergeWith(apply(url('./files/components'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app/core`
				})]), MergeStrategy.AllowCreationConflict);
			},
			(tree) => {
				tree.overwrite(`projects/${name}/src/styles.scss`, createCustomTheme(strings.dasherize(name)))
			},
		])
	}
}
