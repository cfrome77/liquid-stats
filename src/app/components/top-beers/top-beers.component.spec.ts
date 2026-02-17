import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TopBeersComponent } from "./top-beers.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("TopbeersComponent", () => {
  let component: TopBeersComponent;
  let fixture: ComponentFixture<TopBeersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopBeersComponent],
      imports: [SharedTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
