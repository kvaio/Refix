import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TechnicianPanelPage } from './technician-panel.page';

const routes: Routes = [
  {
    path: '',
    component: TechnicianPanelPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TechnicianPanelPageRoutingModule {}
