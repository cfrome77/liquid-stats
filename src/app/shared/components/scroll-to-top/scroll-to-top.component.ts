import { Component, HostListener } from '@angular/core';

@Component({
    selector: 'app-scroll-to-top',
    templateUrl: './scroll-to-top.component.html',
    styleUrls: ['./scroll-to-top.component.css']
})
export class ScrollToTopComponent {
    isVisible: boolean = false;

    // Listen for scroll events to toggle button visibility based on scroll position
    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isVisible = window.scrollY > 100; // Show button after scrolling 100px
    }

    // Scroll to the top of the page
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
