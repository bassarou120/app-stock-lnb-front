import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { AnnulationTicketService } from '../../../../core/services/annulation-ticket/annulation-ticket.service';
import { AnnulationTicket, CompagniePetroliere, MouvementTicket, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';

declare var bootstrap: any;

@Component({
  selector: 'app-annulation-ticket',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
  ],
  templateUrl: 'annulation-ticket.component.html'
})
export class AnnulationTicketComponent implements OnInit {

  rows: AnnulationTicket[] = [];
  temp: AnnulationTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  mouvementsTickets: MouvementTicket[] = []; // Liste des mouvements de sortie non annulés
  couponsTickets: CouponTicket[] = []; // Liste des coupons ticket
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  ancienQteDuMvt: number;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addAnnulationTicket!: FormGroup;
  public editAnnulationTicket!: FormGroup;
  public deleteAnnulationTicket!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private annulationTicketService: AnnulationTicketService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loadAllSortieTicketWhereNotInAnnulation();
    this.loadAnnulationTickets();
    this.loadCompagniePetrolieres();
    this.loadCouponTickets();

    this.addAnnulationTicket = this.formBuilder.group({
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
    });
    this.editAnnulationTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
    });
    this.deleteAnnulationTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  onClickSubmitAddAnnulationTicket() {
    console.log(this.addAnnulationTicket.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addAnnulationTicket.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.annulationTicketService.saveAnnulationTickett(this.addAnnulationTicket.value).subscribe(
        (data: any) => {
          this.loadAnnulationTickets();
          if (spinner) spinner.classList.add('d-none');
          this.addAnnulationTicket.reset();

          const modal = document.getElementById('add_annulation');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'annulation du ticket :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditAnnulationTicket() {
    console.log(this.editAnnulationTicket.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editAnnulationTicket.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editAnnulationTicket.value.id;
      this.annulationTicketService.editAnnulationTicket(this.editAnnulationTicket.value).subscribe(
        (data: any) => {
          this.loadAnnulationTickets();
          if (spinner) spinner.classList.add('d-none');
          this.editAnnulationTicket.reset();

          const modal = document.getElementById('edit_annulationTicket');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la modification de l\'annulation du ticket:', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteAnnulationTicket() {
    console.log(this.deleteAnnulationTicket.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteAnnulationTicket.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.annulationTicketService.deleteAnnulationTicket(this.deleteAnnulationTicket.value).subscribe(
        (data: any) => {
          this.loadAnnulationTickets();
          if (spinner) spinner.classList.add('d-none');
          this.deleteAnnulationTicket.reset();

          const modal = document.getElementById('delete_annulation');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la suppression de l\'annulation du ticket :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadAllSortieTicketWhereNotInAnnulation(): void {
    this.annulationTicketService.getAllSortieTicketWhereNotInAnnulation().subscribe({
      next: (data) => {
        this.mouvementsTickets = data;
        console.log("Liste des mouvements de sortie non annulés :", this.mouvementsTickets);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des mouvements :", err);
      }
    });
  }

  loadAnnulationTickets(): void {
    this.annulationTicketService.getAllAnnulationTicket().subscribe(
      (data: AnnulationTicket[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des annulations de tickets', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(annulationTicket =>
      annulationTicket.created_at.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editAnnulationTicket.patchValue({
      id: row.id,
      mouvementTicket_id: row.mouvementTicket_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      qte: row.qte,
    });
  }

  getDeleteForm(row: any) {
    this.deleteAnnulationTicket.patchValue({
      id: row.id,
    });
  }

  loadCouponTickets(): void {
    this.annulationTicketService.getAllCouponTickets().subscribe({
      next: (data) => {
        this.couponsTickets = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des coupons tickets :", err);
      }
    });
  }

  loadCompagniePetrolieres(): void {
    this.annulationTicketService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagnies Petrolieres :", err);
      }
    });
  }

  getMouvementInfo() {
    const idMouvement = this.addAnnulationTicket.get('mouvementTicket_id')?.value;
    console.log('ID du Mouvement sélectionné:', idMouvement);
    if (!idMouvement) {
      console.log('Aucun Mouvement sélectionné ou désélection effectuée');
      return;
    }
    this.annulationTicketService.getMouvementInfo(idMouvement).subscribe(
      (response) => {
        console.log('Info Récupérée:', response);
        this.addAnnulationTicket.patchValue({
          compagnie_petrolier_id: response.compagnie_petrolier_id,
          coupon_ticket_id: response.coupon_ticket_id,
          qte: response.quantite 
        });
        this.ancienQteDuMvt = response.quantite;
        const qteControl = this.addAnnulationTicket.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.ancienQteDuMvt)
        ]);
        qteControl?.updateValueAndValidity();
      },
      (error) => {
        console.error('Erreur lors des Infos:', error);
      }
    );
  }
}