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


export function factory(_options: App): Rule {
	return (_tree: Tree, _context: SchematicContext) => {

		const {name} = _options;

		return chain([
			externalSchematic('@schematics/angular', 'application', {
				..._options,
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
				return mergeWith(apply(url('./files/routers'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			(tree, context) => {
				if (tree.exists('angular.json')) {
					const sourceText = tree.read('angular.json')!.toString('utf-8');
					const json = JSON.parse(sourceText);

					json.projects[name].schematics['@schematics/angular:component'].changeDetection = 'OnPush'

					tree.overwrite('angular.json', JSON.stringify(json, null, MergeStrategy.ContentOnly));
				}

				tree.overwrite(`projects/${name}/src/app/app.component.html`, '<router-outlet></router-outlet>')

				const installTaskId = context.addTask(new NodePackageInstallTask({
					packageName: '@angular/cdk @angular/material @angular/flex-layout @ngrx/store @ngrx/effects @ngrx/router-store @ngrx/store-devtools'
				}));
				context.addTask(new RunSchematicTask('app-after', _options), [installTaskId]);
			}
		]);
	};
}
