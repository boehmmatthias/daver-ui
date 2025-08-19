import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigUpload } from './config-upload';

describe('ConfigUpload', () => {
  let component: ConfigUpload;
  let fixture: ComponentFixture<ConfigUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
