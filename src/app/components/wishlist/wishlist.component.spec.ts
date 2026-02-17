import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { of } from "rxjs";

import { WishlistComponent } from "./wishlist.component";
import { DataService } from "src/app/core/services/data.service";

describe("WishlistComponent", () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = {
      getWishlist: () => of({ response: { beers: { items: [] } } }),
    };

    await TestBed.configureTestingModule({
      declarations: [WishlistComponent],
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [{ provide: DataService, useValue: mockDataService }],
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
