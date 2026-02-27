import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WishlistComponent } from "./wishlist.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { DataService } from "../../core/services/data.service";
import { of } from "rxjs";

describe("WishlistComponent", () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["getWishlist"]);
    mockDataService.getWishlist.and.returnValue(of({
      response: {
        wishlist: {
          items: []
        }
      }
    }));

    await TestBed.configureTestingModule({
      imports: [WishlistComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: DataService, useValue: mockDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
