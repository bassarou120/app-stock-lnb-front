import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { RetourTicketService } from '../../../../core/services/retour-ticket/retour-ticket.service';
import { RetourTicket, CompagniePetroliere, MouvementTicket  } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
declare var bootstrap: any;

@Component({
  selector: 'retour-ticket',
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
  templateUrl: 'retour-ticket.component.html'
})
export class RetourTicketComponent implements OnInit {

  rows: RetourTicket[] = [];
  temp: RetourTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  mouvementsTickets: MouvementTicket[] = []; // Liste des mouvements

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addRetourTicket!: FormGroup ;
  public editRetourTicket!: FormGroup ;
  public deleteRetourTicket!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private retourTicketService: RetourTicketService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadMouvementTickets();
    this.loadRetourTickets();
    this.addRetourTicket = this.formBuilder.group({
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1 ,[Validators.required]],
   });
    this.editRetourTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1 ,[Validators.required]],
   });
    this.deleteRetourTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  onClickSubmitAddRetourTicket() {
  console.log(this.addRetourTicket.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addRetourTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.retourTicketService.saveRetourTicket(this.addRetourTicket.value).subscribe(
      (data: any) => {
        this.loadRetourTickets();
        if (spinner) spinner.classList.add('d-none');
        this.addRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_retourTicket');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de l\'ajout du retour de ticket :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditRetourTicket(){
  console.log(this.editRetourTicket.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editRetourTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editRetourTicket.value.id;
    this.retourTicketService.editRetourTicket(this.editRetourTicket.value).subscribe(
      (data: any) => {
        this.loadRetourTickets();
        if (spinner) spinner.classList.add('d-none');
        this.editRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_retourTicket');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de la modification du retour Ticket:', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteSousTypeImmo(){
  console.log(this.deleteRetourTicket.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteRetourTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.retourTicketService.deleteRetourTicket(this.deleteRetourTicket.value).subscribe(
      (data: any) => {
        this.loadRetourTickets();
        if (spinner) spinner.classList.add('d-none');
        this.deleteRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_retourTicket');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de la supression du retour Ticket :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

loadMouvementTickets(): void {
  this.retourTicketService.getAllMouvementTicketSortie().subscribe({
    next: (data) => {
      this.mouvementsTickets = data; // Stocker la liste des types d'immos
    },
    error: (err) => {
      console.error("Erreur lors du chargement des mouvements :", err);
    }
  });
}


loadRetourTickets(): void {
    this.retourTicketService.getAllRetourTickets().subscribe(
      (data: RetourTicket[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Retours Tickets', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(retourTicket =>
      retourTicket.created_at.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editRetourTicket.patchValue({
     id:row.id,
     mouvementTicket_id:row.mouvementTicket_id,
     compagnie_petrolier_id:row.compagnie_petrolier_id,
     coupon_ticket_id:row.coupon_ticket_id,
     qte:row.qte,
    })
  }

  getDeleteForm(row: any){
    this.deleteRetourTicket.patchValue({
     id:row.id,
    })
  }
 }


