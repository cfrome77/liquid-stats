import { Component, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-scroll-to-top",
  templateUrl: "./scroll-to-top.component.html",
  styleUrls: ["./scroll-to-top.component.css"],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class ScrollToTopComponent {
  isVisible = false;

  // Listen for scroll events to toggle button visibility based on scroll position
  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.isVisible = window.scrollY > 100; // Show button after scrolling 100px
  }

  // Scroll to the top of the page
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
