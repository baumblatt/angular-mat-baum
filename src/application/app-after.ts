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
import {debug, getAngularSchematicsDefaults, makeChanges} from "../utils/utils";
import {addImportToModule, insertImport} from "@schematics/angular/utility/ast-utils";
import {ReplaceChange} from "@schematics/angular/utility/change";
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";

export function factory(_options: App): Rule {
	return (_tree: Tree, _context: SchematicContext) => {

		const {name} = _options;

		debug(_options, 'Creating additional modules and components');
		return chain([
			externalSchematic('@angular/material', 'ng-add', {
				project: name,
				animations: true,
				theme: 'custom',
				typography: true
			}),

			externalSchematic('@schematics/angular', 'module', {
				...getAngularSchematicsDefaults(_tree, name)['@schematics/angular:module'],
				name: 'shared',
				module: 'core/core.module',
				path: `projects/${name}/src/app`,
			}),
			externalSchematic('@schematics/angular', 'module', {
				...getAngularSchematicsDefaults(_tree, name)['@schematics/angular:module'],
				name: 'material',
				module: 'shared/shared.module',
				path: `projects/${name}/src/app`,
			}),
			externalSchematic('@schematics/angular', 'component', {
				...getAngularSchematicsDefaults(_tree, name)['@schematics/angular:component'],
				project: name,
				type: 'dialog',
				name: 'components/loading',
				path: `projects/${name}/src/app/core`,
				style: 'scss',
				skipTests: _options.skipTests
			}),
			externalSchematic('@schematics/angular', 'component', {
				...getAngularSchematicsDefaults(_tree, name)['@schematics/angular:component'],
				project: name,
				type: 'container',
				name: 'containers/home',
				path: `projects/${name}/src/app/core`,
				style: 'scss',
				skipTests: _options.skipTests
			}),
			externalSchematic('@schematics/angular', 'component', {
				...getAngularSchematicsDefaults(_tree, name)['@schematics/angular:component'],
				project: name,
				type: 'container',
				name: 'containers/layout',
				path: `projects/${name}/src/app/core`,
				style: 'scss',
				skipTests: _options.skipTests
			}),
			() => {
				debug(_options, 'Updating the modules created');
				return mergeWith(apply(url('./files/modules'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			() => {
				debug(_options, 'Updating styles');
				return mergeWith(apply(url('./files/styles'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			() => {
				debug(_options, 'Updating components');
				return mergeWith(apply(url('./files/components'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app/core`
				})]), MergeStrategy.AllowCreationConflict);
			},
			() => {
				debug(_options, 'Creating the store of App and Core modules');
				return mergeWith(apply(url('./files/store'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			(tree) => {
				debug(_options, 'Initializing the store on App module');
				const source = ts.createSourceFile(
					`projects/${name}/src/app/app.module.ts`,
					// @ts-ignore
					tree.read(`projects/${name}/src/app/app.module.ts`).toString(),
					ts.ScriptTarget.Latest, true
				);

				const changes = addImportToModule(
					source,
					`projects/${name}/src/app/app.module.ts`,
					`EffectsModule.forRoot([])`,
					'@ngrx/effects'
				);

				changes.push(...addImportToModule(
					source,
					`projects/${name}/src/app/app.module.ts`,
					`StoreModule.forRoot(reducers, { metaReducers, runtimeChecks: { strictStateImmutability: true, strictActionImmutability: true }})`,
					'@ngrx/store'
				));

				changes.push(...addImportToModule(
					source,
					`projects/${name}/src/app/app.module.ts`,
					`StoreDevtoolsModule.instrument({name: '${name}', maxAge: 25, logOnly: environment.production})`,
					'@ngrx/store-devtools'
				));

				changes.push(...addImportToModule(
					source,
					`projects/${name}/src/app/app.module.ts`,
					`StoreRouterConnectingModule.forRoot()`,
					'@ngrx/router-store'
				));

				changes.push(insertImport(
					source,
					`projects/${name}/src/app/app.module.ts`,
					'reducers, metaReducers',
					'./store/reducers/global.reducers'
				));

				changes.push(insertImport(
					source,
					`projects/${name}/src/app/app.module.ts`,
					'environment',
					'../environments/environment'
				));

				return makeChanges(tree, `projects/${name}/src/app/app.module.ts`, changes);
			},
			(tree) => {
				debug(_options, 'Initializing the store on Core module');
				const source = ts.createSourceFile(
					`projects/${name}/src/app/core/core.module.ts`,
					// @ts-ignore
					tree.read(`projects/${name}/src/app/core/core.module.ts`).toString(),
					ts.ScriptTarget.Latest, true
				);

				const changes = addImportToModule(
					source,
					`projects/${name}/src/app/core/core.module.ts`,
					`EffectsModule.forFeature([MessagesEffects])`,
					'@ngrx/effects'
				);

				changes.push(...addImportToModule(
					source,
					`projects/${name}/src/app/core/core.module.ts`,
					`StoreModule.forFeature('core', coreReducers)`,
					'@ngrx/store'
				));

				changes.push(insertImport(
					source,
					`projects/${name}/src/app/core/core.module.ts`,
					'MessagesEffects',
					'./store/effects/messages.effects'
				));

				changes.push(insertImport(
					source,
					`projects/${name}/src/app/core/core.module.ts`,
					'coreReducers',
					'./store/reducers/feature.reducer'
				));

				return makeChanges(tree, `projects/${name}/src/app/core/core.module.ts`, changes);
			},
			(tree) => {
				debug(_options, 'Updating the index.html view port');

				const index = `projects/${name}/src/index.html`;
				const source: Buffer = tree.read(index) as Buffer;

				const old = 'width=device-width, initial-scale=1';
				const position = source.toString().lastIndexOf(old);

				const change = new ReplaceChange(index, position, old,
					'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no'
				);

				return makeChanges(tree, index, [change]);
			},
			(tree) => {
				debug(_options, 'Update the material theme scss.');
				tree.overwrite(`projects/${name}/src/styles.scss`, createCustomTheme(strings.dasherize(name)));
			},
		])
	}
}
