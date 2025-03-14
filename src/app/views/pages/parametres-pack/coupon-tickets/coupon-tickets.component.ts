import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CouponTicketService } from '../../../../core/services/coupon-tickets/coupon-tickets.service';
import { CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-coupon-tickets',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule 
  ],
  templateUrl: 'coupon-tickets.component.html'
})
export class CouponTicketsComponent implements OnInit {

  rows: CouponTicket[] = [];
  temp: CouponTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addCouponTicket!: FormGroup ;
  public editCouponTicket!: FormGroup ;
  public deleteCouponTicket!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private couponTicketService: CouponTicketService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadCouponTickets();
    this.addCouponTicket = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      valeur: ["" ,[Validators.required]],
   });
    this.editCouponTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      valeur: [0, [Validators.required]],
   });
    this.deleteCouponTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddCouponTicket() {
  console.log(this.addCouponTicket.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addCouponTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.couponTicketService.saveCouponTicket(this.addCouponTicket.value).subscribe(
      (data: any) => {
        this.loadCouponTickets();
        if (spinner) spinner.classList.add('d-none');
        this.addCouponTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_couponTicket');
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
        console.error('Erreur lors de l\'ajout du coupon :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditCouponTicket(){
  console.log(this.editCouponTicket.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editCouponTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editCouponTicket.value.id;
    this.couponTicketService.editCouponTicket(this.editCouponTicket.value).subscribe(
      (data: any) => {
        this.loadCouponTickets();
        if (spinner) spinner.classList.add('d-none');
        this.editCouponTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_couponTicket');
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
        console.error('Erreur lors de la modification du coupon :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteCouponTicket(){
  console.log(this.deleteCouponTicket.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteCouponTicket.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.couponTicketService.deleteCouponTicket(this.deleteCouponTicket.value).subscribe(
      (data: any) => {
        this.loadCouponTickets();
        if (spinner) spinner.classList.add('d-none');
        this.deleteCouponTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_couponTicket');
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
        console.error('Erreur lors de la supression du Coupon :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

  

loadCouponTickets(): void {
    this.couponTicketService.getAllCouponTickets().subscribe(
      (data: CouponTicket[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Coupon Tickets', error);
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

  getEditForm(row: any){
    this.editCouponTicket.patchValue({
     id:row.id,
     libelle:row.libelle,
     valeur:row.valeur,
    })
  }

  getDeleteForm(row: any){
    this.deleteCouponTicket.patchValue({
     id:row.id,
    })
  }
 }


