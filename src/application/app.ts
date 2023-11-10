import {
	apply,
	chain,
	externalSchematic,
	MergeStrategy,
	mergeWith,
	Rule,
	SchematicContext, template,
	Tree, url
} from '@angular-devkit/schematics';
import {NodePackageInstallTask, RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {strings} from "@angular-devkit/core";
import {debug} from "../utils/utils";


export function factory(_options: App): Rule {
	return (_tree: Tree, _context: SchematicContext) => {

		const {name, verbose, ...options} = _options;

		debug(_options, 'Create the application and core module');

		return chain([
			externalSchematic('@schematics/angular', 'application', {
				...options,
				name,
				routing: true,
				style: 'scss',
				inlineStyle: false,
				inlineTemplate: false
			}),
			externalSchematic('@schematics/angular', 'module', {
				name: 'core',
				routing: true,
				path: `projects/${name}/src/app`,
			}),
			() => {
				debug(_options, 'Updating the App and Core router modules.');

				return mergeWith(apply(url('./files/routers'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			(tree, context) => {
				if (tree.exists('angular.json')) {
					debug(_options, 'Updating the angular.json.');

					const sourceText = tree.read('angular.json')!.toString('utf-8');
					const json = JSON.parse(sourceText);

					json.projects[name].schematics['@schematics/angular:component'].changeDetection = 'OnPush'

					tree.overwrite('angular.json', JSON.stringify(json, null, MergeStrategy.ContentOnly));
				}

				debug(_options, 'Updating the app.component.html');
				tree.overwrite(`projects/${name}/src/app/app.component.html`, '<router-outlet></router-outlet>')

				debug(_options, 'Installing dependencies.');
				const installTaskId = context.addTask(new NodePackageInstallTask({
					packageName: '@angular/cdk@14.x @angular/material@14.x @angular/flex-layout@14.0.0-beta.41 @ngrx/store@14.x @ngrx/effects@14.x @ngrx/entity@14.x @ngrx/router-store@14.x @ngrx/store-devtools@14.x'
				}));
				context.addTask(new RunSchematicTask('app-after', _options), [installTaskId]);
			}
		]);
	};
}
