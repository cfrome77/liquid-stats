import { TestBed } from "@angular/core/testing";

import { DataService } from "./data.service";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("DataService", () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SharedTestingModule] });
    service = TestBed.inject(DataService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
