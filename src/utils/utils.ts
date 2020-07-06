import {Tree} from "@angular-devkit/schematics";
import {InsertChange} from "@ngrx/schematics/schematics-core";
import {Change} from "@schematics/angular/utility/change";
import {buildRelativePath} from "@schematics/angular/utility/find-module";

export const getAngularSchematicsDefaults = (tree: Tree, project: string) => {
  if (tree.exists('angular.json')) {
    const sourceText = tree.read('angular.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    return json.projects[project].schematics;
  }
}

export const addMixin = (tree: Tree, stylePath: string, mixinPath: string) => {
  const stylePathContent = tree.read(stylePath)?.toString() || '';

  const relativePath = buildRelativePath(stylePath, mixinPath);

  const changes = [new InsertChange(
    stylePath,
    stylePathContent.split('\n').reduce((acc: number, cur: string) => {
      return cur.startsWith('@import') ? acc + cur.length + 1 : acc;
    }, 0),
    `@import "${relativePath}";\n`
  )];

  return changes;
}

export const makeChanges = (tree: Tree, path: string, changes: Change[]) => {
  const recorder = tree.beginUpdate(path);

  for (const change of changes) {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  }

  tree.commitUpdate(recorder);

  return tree;
}
