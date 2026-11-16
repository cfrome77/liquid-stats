import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { BadgeDialogComponent } from "./badge-dialog.component";

describe("BadgeDialogComponent", () => {
  let fixture: ComponentFixture<BadgeDialogComponent>;

  const dialogData: {
    badge_name: string;
    badge_description?: string;
    badge_image: { sm: string };
    created_at: string;
  } = {
    badge_name: "Test Badge",
    badge_image: { sm: "test.jpg" },
    created_at: "2023-01-01",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeDialogComponent, MatDialogModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: dialogData }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  /** Renders the dialog with the given description and returns its host element. */
  function render(description: string): HTMLElement {
    dialogData.badge_description = description;
    fixture = TestBed.createComponent(BadgeDialogComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it("should create", () => {
    render("Earned a badge");
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("keeps links and bold text from the description", () => {
    const host = render(
      'Enjoyed a <strong>hoppy</strong> <a href="https://untappd.com">beer</a>',
    );

    const container = host.querySelector(
      ".description-container",
    ) as HTMLElement;
    expect(container.querySelector("strong")?.textContent).toBe("hoppy");
    expect(container.querySelector("a")?.textContent).toBe("beer");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://untappd.com",
    );
  });

  it("strips scripts and event-handler attributes from the description", () => {
    const host = render(
      '<a href="https://untappd.com" onclick="window.hacked = true">Link</a>' +
        '<img src="x" onerror="window.hacked = true" />' +
        "<script>window.hacked = true;</script>",
    );

    const container = host.querySelector(
      ".description-container",
    ) as HTMLElement;
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("onclick")).toBeNull();
    // The safe link still renders.
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://untappd.com",
    );
  });
});
