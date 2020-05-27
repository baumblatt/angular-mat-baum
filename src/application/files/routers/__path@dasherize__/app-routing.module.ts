import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';


const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'core'},
  {path: 'core', loadChildren: () => import('./core/core.module').then(m => m.CoreModule)},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
