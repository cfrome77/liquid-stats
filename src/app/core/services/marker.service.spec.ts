import { TestBed } from "@angular/core/testing";

import { MarkerService } from "./marker.service";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("MarkerService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [SharedTestingModule] }),
  );

  it("should be created", () => {
    const service: MarkerService = TestBed.get(MarkerService);
    expect(service).toBeTruthy();
  });
});
