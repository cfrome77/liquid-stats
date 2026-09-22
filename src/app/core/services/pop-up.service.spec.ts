import { TestBed } from "@angular/core/testing";
import { PopUpService } from "./pop-up.service";

describe("PopUpService", () => {
  let service: PopUpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopUpService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should generate popup HTML with brewery info", () => {
    const html = service.makePopup(
      "Sierra Nevada",
      "CA",
      "Chico",
      "logo.png",
      12,
    );
    expect(html).toContain("Sierra Nevada");
    expect(html).toContain("Chico, CA");
    expect(html).toContain("Total Check-ins: <strong>12</strong>");
    expect(html).toContain('src="logo.png"');
  });
});
