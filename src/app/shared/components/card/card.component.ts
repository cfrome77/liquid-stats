import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";

@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.css"],
})
export class CardComponent implements OnInit {
  @Input() cardData: any;
  @Output() badgeClick = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {}

  onBadgeClick(badge: any): void {
    this.badgeClick.emit(badge);
  }
}
