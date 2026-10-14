import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechnicianPanelPage } from './technician-panel.page';

describe('TechnicianPanelPage', () => {
  let component: TechnicianPanelPage;
  let fixture: ComponentFixture<TechnicianPanelPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicianPanelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
