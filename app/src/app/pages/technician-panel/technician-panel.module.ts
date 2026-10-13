import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { TechnicianPanelPageRoutingModule } from './technician-panel-routing.module';

import { TechnicianPanelPage } from './technician-panel.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TechnicianPanelPageRoutingModule
  ],
  declarations: [TechnicianPanelPage]
})
export class TechnicianPanelPageModule {}
