import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

import { NotFoundComponent } from "./not-found.component";

describe("NotFoundComponent", () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent, RouterTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows the themed 404 copy and the popular-page links", () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("404");
    expect(el.textContent).toContain("This page went flat");
    expect(el.querySelectorAll(".nf-link").length).toBe(
      component.quickLinks.length,
    );
  });

  it("navigates home when the primary action is used", () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, "navigate");
    component.goHome();
    expect(navigate).toHaveBeenCalledWith(["/"]);
  });

  it("uses browser history for the back action", () => {
    const back = spyOn(window.history, "back");
    component.goBack();
    expect(back).toHaveBeenCalled();
  });
});
