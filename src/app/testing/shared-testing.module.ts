import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// Angular Material Modules
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

// Your shared / custom components
import { FilterComponent } from 'src/app/shared/components/filter/filter.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { PoweredByComponent } from 'src/app/shared/components/powered-by/powered-by.component';
import { CardComponent } from 'src/app/shared/components/card/card.component';
import { BadgeDialogComponent } from 'src/app/shared/components/badge-dialog/badge-dialog.component';
import { BeerStyleDialogComponent } from 'src/app/shared/components/beer-style-dialog/beer-style-dialog.component';

@NgModule({
  declarations: [
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HttpClientTestingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
  ],
  exports: [
    ReactiveFormsModule,
    FormsModule,
    HttpClientTestingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedTestingModule {}
