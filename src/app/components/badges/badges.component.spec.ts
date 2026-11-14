import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { of, throwError } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { BadgesComponent } from "./badges.component";
import { DataService } from "src/app/core/services/data.service";

describe("BadgesComponent", () => {
  let component: BadgesComponent;
  let fixture: ComponentFixture<BadgesComponent>;
  let mockDataService: Partial<DataService>;

  beforeEach(async () => {
    mockDataService = {
      getBadges: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [BadgesComponent, HttpClientTestingModule, MatDialogModule],
      providers: [{ provide: DataService, useValue: mockDataService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows a retryable error state when the badges request fails", () => {
    mockDataService.getBadges = () =>
      throwError(() => new Error("network error"));
    mockDataService.clearCache = jasmine.createSpy("clearCache");

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasLoadError()).toBeTrue();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("couldn't load your badges");

    const button = el.querySelector(
      "app-empty-state button",
    ) as HTMLButtonElement;
    button.click();
    expect(mockDataService.clearCache).toHaveBeenCalled();
  });
});
