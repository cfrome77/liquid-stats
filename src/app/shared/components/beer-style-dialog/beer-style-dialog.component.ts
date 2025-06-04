import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-beer-style-dialog',
  templateUrl: './beer-style-dialog.component.html',
  styleUrls: ['./beer-style-dialog.component.css']
})
export class BeerStyleDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
  }

}
