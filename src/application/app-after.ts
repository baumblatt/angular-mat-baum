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

import {
	addImportToModule, insertImport,
} from '@ngrx/schematics/schematics-core';
import * as ts from 'typescript';
import {getAngularSchematicsDefaults, makeChanges} from "../utils/utils";
import {ReplaceChange} from "@schematics/angular/utility/change";

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
				type: 'container',
				name: 'containers/layout',
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
			() => {
				return mergeWith(apply(url('./files/modules'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			() => {
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
			() => {
				return mergeWith(apply(url('./files/store'), [template({
					..._options,
					...strings,
					path: `projects/${name}/src/app`
				})]), MergeStrategy.AllowCreationConflict);
			},
			(tree) => {
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
					`StoreDevtoolsModule.instrument({maxAge: 25, logOnly: environment.production})`,
					'@ngrx/store-devtools'
				));

				changes.push(...addImportToModule(
					source,
					`projects/${name}/src/app/app.module.ts`,
					`StoreRouterConnectingModule.forRoot({ serializer: CustomSerializer })`,
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

				changes.push(insertImport(
					source,
					`projects/${name}/src/app/app.module.ts`,
					'CustomSerializer',
					'./store/reducers/custom-route-serializer'
				));

				return makeChanges(tree, `projects/${name}/src/app/app.module.ts`, changes);
			},
			(tree) => {
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
				const index = `projects/${name}/src/index.html`;
				const source: Buffer = tree.read(index) as Buffer;

				const old = 'width=device-width, initial-scale=1';

				const change = new ReplaceChange(index, source.toString().lastIndexOf(old), old,
					'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no'
				);

				return makeChanges(tree, index, [change]);
			}
		])
	}
}
