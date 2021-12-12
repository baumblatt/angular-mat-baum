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
import {addMethod, addMixin, debug, getAngularSchematicsDefaults, makeChanges} from "../utils/utils";
import {Path, strings} from "@angular-devkit/core";
import {buildRelativePath, findModuleFromOptions} from "@schematics/angular/utility/find-module";
import {parseName} from "@schematics/angular/utility/parse-name";
import {addRouteDeclarationToModule, insertImport} from "@schematics/angular/utility/ast-utils";
import {classify} from "@angular-devkit/core/src/utils/strings";
import {ReplaceChange} from "@schematics/angular/utility/change";
import * as ts from "@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript";

export function factory(_options: Component): Rule {


  return async (_tree: Tree, _context: SchematicContext) => {
    const workspace = await getWorkspace(_tree);
    const project = workspace.projects.get(_options.project as string);

    if (_options.path === undefined) {
      _options.path = await createDefaultPath(_tree, _options.project as string);
    }

    const modulePath = findModuleFromOptions(_tree, _options) as Path;
    const moduleFile = modulePath.split('/').pop() || '';
    const moduleDir = modulePath.substring(0, modulePath.indexOf(moduleFile));
    const moduleName = moduleFile.split('.').reverse().pop() || '';

    const parsedPath = parseName(_options.path as string, _options.name);
    _options.name = parsedPath.name;
    _options.path = parsedPath.path;
    _options.selector = _options.selector || buildSelector(_options, project && project.prefix || '');

    const name = strings.dasherize(_options.name);
    const componentPath = `${_options.path}/${name}/${name}.${_options.type}.ts`

    debug(_options, 'Creating the component');

    return chain([
      // create the component using original Angular Schematics
      externalSchematic('@schematics/angular', 'component', {
        ...getAngularSchematicsDefaults(_tree, _options.project as string)['@schematics/angular:component'],
        changeDetection: 'OnPush',
        export: _options.export,
        displayBlock: false,
        inlineTemplate: false,
        inlineStyle: false,
        module: _options.module,
        name: _options.name,
        path: _options.path,
        prefix: _options.prefix,
        project: _options.project,
        selector: _options.selector,
        skipSelector: _options.skipSelector,
        skipTests: _options.skipTests,
        style: 'scss',
        type: _options.type,
        viewEncapsulation: _options.viewEncapsulation
      }),
      // insert template files based on type
      () => {
        debug(_options, 'Updating the created component');
        return mergeWith(apply(url(`./files/${_options.type}`), [template({
          ..._options,
          ...strings,
          path: `${_options.path}/${name}`
        })]), MergeStrategy.AllowCreationConflict);
      },
      // add style
      (_tree) => {
        debug(_options, 'Reference the component on module theme scss');
        const parentStylePath = `${moduleDir}/${moduleName}.styles.scss`;

        const changes = addMixin(
          _tree,
          parentStylePath,
          `${_options.path}/${name}/${name}.${_options.type}.theme`,
          `${_options.selector}-${_options.type}-theme`
        );

        return makeChanges(_tree, parentStylePath, changes);
      },
      // add router
      (_tree) => {
        if ((_options.type === 'container' || _options.type === 'component') && _options.route) {
          debug(_options, 'Add route to the component on module theme router');

          const componentDeclaration = classify(`${name}-${_options.type}`);
          const moduleRouterPath = `${moduleDir}/${moduleName}-routing.module.ts`;

          const source = ts.createSourceFile(
            moduleRouterPath,
            _tree.read(moduleRouterPath.substring(1))?.toString() || '',
            ts.ScriptTarget.Latest, true
          );

          const relativePath = buildRelativePath(
            moduleRouterPath,
            componentPath.substring(0, componentPath.indexOf('.ts'))
          );

          const changes = [insertImport(
            source,
            moduleRouterPath,
            componentDeclaration,
            relativePath
          )];

          changes.push(addRouteDeclarationToModule(
            source,
            moduleRouterPath,
            `{path: '${_options.route}', component: ${componentDeclaration}}`,
          ));

          return makeChanges(_tree, moduleRouterPath, changes);
        }
      },
      // the container specific steps
      (_tree) => {
        if (_options.type === 'container') {
          debug(_options, 'Update container components');

          const source = ts.createSourceFile(
            componentPath,
            _tree.read(componentPath.substring(1))?.toString() || '',
            ts.ScriptTarget.Latest, true
          );

          const relativePath = buildRelativePath(componentPath,
            `${moduleDir}/store/reducers/feature.reducer`);

          const changes = [insertImport(
            source,
            componentPath,
            `${classify(moduleName)}State`,
            relativePath
          )];

          changes.push(insertImport(
            source,
            componentPath,
            `Store`,
            '@ngrx/store'
          ));

          changes.push(replaceConstructor(
            source,
            componentPath,
            `(private store: Store<${classify(moduleName)}State>)`
          ));

          return makeChanges(_tree, componentPath, changes);
        }
      },
      // the dialog specific steps
      (_tree) => {
        if (_options.type === 'dialog') {
          debug(_options, 'Update dialog components');

          const source = ts.createSourceFile(
            componentPath,
            _tree.read(componentPath.substring(1))?.toString() || '',
            ts.ScriptTarget.Latest, true
          );

          const changes = [insertImport(
            source,
            componentPath,
            'MatDialogRef, MAT_DIALOG_DATA',
            '@angular/material/dialog'
          )];

          changes.push(insertImport(
            source,
            componentPath,
            'Inject',
            '@angular/core'
          ));

          changes.push(replaceConstructor(
            source,
            componentPath,
            `(public dialogRef: MatDialogRef<${classify(name)}Dialog>, @Inject(MAT_DIALOG_DATA) public data: any)`
          ));

          changes.push(addMethod(source, componentPath,
            `  close(): void {\n    this.dialogRef.close();\n  }`
          ));

          return makeChanges(_tree, componentPath, changes);
        }
      },
      // the bottom-sheet specific steps
      (_tree) => {
        if (_options.type === 'bottom-sheet') {
          debug(_options, 'Update bottom-sheet components');

          const source = ts.createSourceFile(
            componentPath,
            _tree.read(componentPath.substring(1))?.toString() || '',
            ts.ScriptTarget.Latest, true
          );

          const changes = [insertImport(
            source,
            componentPath,
            'MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA',
            '@angular/material/bottom-sheet'
          )];

          changes.push(insertImport(
            source,
            componentPath,
            'Inject',
            '@angular/core'
          ));

          changes.push(replaceConstructor(
            source,
            componentPath,
            `(private bottomSheetRef: MatBottomSheetRef<${classify(name)}BottomSheet>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: any)`
          ));

          changes.push(addMethod(source, componentPath,
            `  close(): void {\n    this.bottomSheetRef.dismiss();\n  }`
          ));

          return makeChanges(_tree, componentPath, changes);
        }
      },
    ]);
  }
}

function replaceConstructor(source: ts.SourceFile, componentPath: string, newConstructor: string) {
  const componentClass = source.statements.find(
    (stm: any) => stm.kind === ts.SyntaxKind.ClassDeclaration
  ) as ts.ClassDeclaration;

  const componentConstructor = componentClass.members.find(
    (member) => member.kind === ts.SyntaxKind.Constructor
  ) as ts.ConstructorDeclaration;

  const [start, end] = componentConstructor.getText().split('()');

  return new ReplaceChange(
    componentPath,
    componentConstructor.pos,
    `  ${componentConstructor.getText()}\n\n`,
    `\n\n  ${[start, newConstructor, end].join('')}`
  );
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
