import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WishlistComponent } from "./wishlist.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("WishlistComponent", () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WishlistComponent],
      imports: [SharedTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
