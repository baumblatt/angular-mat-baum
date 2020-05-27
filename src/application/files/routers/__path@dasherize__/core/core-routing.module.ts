import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './containers/home/home.component';
import {LayoutComponent} from './containers/layout/layout.component';


const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'layout'},
  {
    path: 'layout', component: LayoutComponent, children: [
      {path: '', pathMatch: 'full', redirectTo: 'home'},
      {path: 'home', component: HomeComponent},
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule {
}
