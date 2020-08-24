import {Tree} from "@angular-devkit/schematics";
import {Change, InsertChange, ReplaceChange} from "@schematics/angular/utility/change";
import {buildRelativePath} from "@schematics/angular/utility/find-module";

export const getAngularSchematicsDefaults = (tree: Tree, project: string) => {
  if (tree.exists('angular.json')) {
    const sourceText = tree.read('angular.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    return json.projects[project].schematics;
  }
}

export const addMixin = (tree: Tree, stylePath: string, mixinPath: string, mixin: string) => {
  const stylePathContent = tree.read(stylePath)?.toString() || '';

  const relativePath = buildRelativePath(stylePath, mixinPath);
  const styleLines = stylePathContent.split('\n');

  const indentation = (stylePathContent.match(/^([ \t]+)@include/) || [undefined, '  '])[1];

  return [new InsertChange(
    stylePath,
    styleLines.reduce((acc: number, cur: string) => {
      return cur.startsWith('@import') ? acc + cur.length + 1 : acc;
    }, 0),
    `@import "${relativePath}";\n`
  ), new InsertChange(
    stylePath,
    styleLines.reduce((acc: number, cur: string) => {
      return cur.startsWith('@mixin') || cur.indexOf('@include') > -1 ? acc + cur.length + 1 : acc;
    }, stylePathContent.indexOf('@mixin')),
    `${indentation}@include ${mixin}($theme);\n`
  )];
}

export const makeChanges = (tree: Tree, path: string, changes: Change[]) => {
  const recorder = tree.beginUpdate(path);

  // before angular version 10.1.0
  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    } else if (change instanceof ReplaceChange) {
      // @ts-ignore
      recorder.remove(change.pos, change.oldText.length);
      // @ts-ignore
      recorder.insertLeft(change.pos, change.newText);
    }
  }

  // waiting angular version 10.1.0.
  // applyToUpdateRecorder(recorder, changes);

  tree.commitUpdate(recorder);

  return tree;
}
