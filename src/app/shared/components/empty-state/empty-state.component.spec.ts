import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EmptyStateComponent } from "./empty-state.component";

describe("EmptyStateComponent", () => {
  let fixture: ComponentFixture<EmptyStateComponent>;
  let component: EmptyStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it("renders the message and no button by default", () => {
    component.message = "Nothing here yet.";
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("Nothing here yet.");
    expect(el.querySelector("button")).toBeNull();
    expect(el.querySelector(".empty-state")?.classList).not.toContain("error");
  });

  it("renders the action button and emits on click", () => {
    let emitted = 0;
    component.message = "Something failed.";
    component.buttonText = "Retry";
    component.action.subscribe(() => (emitted += 1));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      "button",
    ) as HTMLButtonElement;
    expect(button.textContent).toContain("Retry");
    button.click();
    expect(emitted).toBe(1);
  });

  it("applies error styling when variant is error", () => {
    component.variant = "error";
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(".empty-state")?.classList,
    ).toContain("error");
  });

  it("announces an error as an alert", () => {
    component.message = "We couldn't load your data.";
    component.variant = "error";
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(".empty-state")?.getAttribute("role"),
    ).toBe("alert");
  });

  it("announces an empty result as a status", () => {
    component.message = "Nothing here yet.";
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(".empty-state")?.getAttribute("role"),
    ).toBe("status");
  });
});
