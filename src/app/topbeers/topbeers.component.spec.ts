import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopbeersComponent } from './topbeers.component';

describe('TopbeersComponent', () => {
  let component: TopbeersComponent;
  let fixture: ComponentFixture<TopbeersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TopbeersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopbeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
