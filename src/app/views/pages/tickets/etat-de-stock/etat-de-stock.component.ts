import { Component, ViewChild, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../../core/services/articles/articles.service';
import { CouponTicketService } from '../../../../core/services/coupon-tickets/coupon-tickets.service';
import { Categorie, Article, CouponTicket, } from '../../../../core/services/interface/models';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';  // Ajoutez cette importation

declare var bootstrap: any;

@Component({
  selector: 'etat-de-stock',
  standalone: true,
  imports: [
    NgxDatatableModule,
    NgSelectModule,
    CommonModule,
    FormsModule,  // Ajoutez ce module pour utiliser ngModel
  ],
  templateUrl: 'etat-de-stock.component.html',
  styleUrls: ['etat-de-stock.component.scss']
})
export class EtatStockComponent implements OnInit {
  rows: CouponTicket[] = [];
  temp: CouponTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  selectedCategoryId: number | null = null;  // Ajoutez cette propriété

  @ViewChild('table') table!: DatatableComponent;

  constructor(private couponTicketService: CouponTicketService) {}

  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    this.loadCouponTickets();
  }


  loadCouponTickets(): void {
    this.couponTicketService.getAllCouponTickets().subscribe(
      (data: CouponTicket[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Coupons', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(couponTicket =>
      couponTicket.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }


}
