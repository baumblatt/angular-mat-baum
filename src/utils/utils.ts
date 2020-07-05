import {Tree} from "@angular-devkit/schematics";

export const getAngularSchematicsDefaults = (tree: Tree, project: string) => {
  if (tree.exists('angular.json')) {
    const sourceText = tree.read('angular.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    return json.projects[project].schematics;
  }
}
