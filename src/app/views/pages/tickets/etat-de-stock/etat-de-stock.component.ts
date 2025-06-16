import { Component, ViewChild, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../../core/services/articles/articles.service';
import { CouponTicketService } from '../../../../core/services/coupon-tickets/coupon-tickets.service';
import { CompagniePetroliere, CouponTicket, StockTicket } from '../../../../core/services/interface/models';
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
  rows: StockTicket[] = [];
  temp: StockTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  couponTickets: CouponTicket[] = [];
  compagnies: CompagniePetroliere[] = [];

  selectedCouponId: number | null = null;
  selectedCompagnieId: number | null = null;


  @ViewChild('table') table!: DatatableComponent;

  constructor(private couponTicketService: CouponTicketService) { }

  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    this.loadStockTicket();
    this.loadDropdownData()
  }


  loadStockTicket(): void {
    this.couponTicketService.getAllStockTickets().subscribe(
      (data: StockTicket[]) => {
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

  loadDropdownData(): void {
    // Tu peux utiliser les mêmes services que pour charger les données
    this.couponTicketService.getAllCouponTickets().subscribe((coupons: CouponTicket[]) => {
      this.couponTickets = coupons;
    });

    this.couponTicketService.getAllCompagniePetrolieres().subscribe((compagnies: CompagniePetroliere[]) => {
      this.compagnies = compagnies;
    });
  }

  applyFilters(): void {
    const val = this.searchText.toLowerCase();

    this.rows = this.temp.filter(item => {
      const matchCoupon = this.selectedCouponId ? item.coupon_ticket_id === this.selectedCouponId : true;
      const matchCompagnie = this.selectedCompagnieId ? item.compagnie_petrolier_id === this.selectedCompagnieId : true;
      const matchSearch =
        item.coupon_ticket?.libelle.toLowerCase().includes(val) ||
        item.compagnie?.libelle.toLowerCase().includes(val) ||
        item.qte_actuel.toString().includes(val);

      return matchCoupon && matchCompagnie && matchSearch;
    });

    this.table.offset = 0;
  }




  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();

    this.rows = this.temp.filter(item => {
      return (
        item.coupon_ticket?.libelle.toLowerCase().includes(val) ||
        item.compagnie?.libelle.toLowerCase().includes(val)
      );
    });

    // Réinitialiser la pagination si besoin
    this.table.offset = 0;
  }

  downloadEtatStockTicketsPDF(): void {
    this.couponTicketService.imprimerEtatStockTickets().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'etat_stock_tickets.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF de l\'état de stock des tickets:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }


}
