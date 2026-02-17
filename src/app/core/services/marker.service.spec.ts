import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MarkerService } from "./marker.service";

describe("MarkerService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    }),
  );

  it("should be created", () => {
    const service: MarkerService = TestBed.inject(MarkerService);
    expect(service).toBeTruthy();
  });
});
