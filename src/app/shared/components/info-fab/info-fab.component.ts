import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";

@Component({
  selector: "app-info-fab",
  templateUrl: "./info-fab.component.html",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
})
export class InfoFabComponent {
  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  openDialog(): void {
    const scrollStrategy = this.overlay.scrollStrategies.reposition();

    import("../../../components/about/about.component").then((m) => {
      this.dialog.open(m.AboutComponent, {
        panelClass: "about-dialog-panel",
        autoFocus: false,
        scrollStrategy,
        width: "95vw",
        maxWidth: "750px",
        maxHeight: "85vh",
        enterAnimationDuration: "250ms",
        exitAnimationDuration: "200ms",
      });
    });
  }
}
