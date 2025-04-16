import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementTicketService } from '../../../../core/services/mouvement-ticket/entree.service';
import { MouvementTicket, Employe, Vehicule, CompagniePetroliere, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-entree',
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
    NgbDatepickerModule,
    FeatherIconDirective
  ],
  templateUrl: 'entree.component.html'
})
export class EntreeComponent implements OnInit {

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementTicket[] = [];
  temp: MouvementTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  employes: Employe[] = []; // Liste des employes
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  vehicules: Vehicule[] = []; // Liste des vehicules
  couponTickets: CouponTicket[] = []; // Liste des coupons

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addEntree!: FormGroup;
  public editEntree!: FormGroup;
  public deleteEntree!: FormGroup;
  addEntreeMultipleForm: FormGroup;

  // Fichiers sélectionnés
  selectedFiles: File[] = [];

  @ViewChild('table') table!: DatatableComponent;

  constructor(private entreeService: MouvementTicketService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadCompagniesPetrolieres();
    this.loadCouponTickets();
    this.loadEmployes();
    this.loadVehicules();
    this.loadEntrees();
    this.addEntree = this.formBuilder.group({
      compagnie_petrolier_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
    });
    this.editEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
    });
    this.deleteEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

  }

  onClickSubmitAddEntree() {
    console.log(this.addEntree.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addEntree.value,
        date: this.formatDate(this.addEntree.value.date), // Convertir la date
      };
      this.entreeService.saveMouvementTicketEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.addEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_entree');
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
          console.error('Erreur lors de l\'ajout de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditEntree() {
    console.log(this.editEntree.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editEntree.value.id;
      const formData = {
        ...this.editEntree.value,
        date: this.formatDate(this.editEntree.value.date), // Convertir la date
      };
      this.entreeService.editMouvementTicketEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.editEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_entree');
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
          console.error('Erreur lors de la modification de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteEntree() {
    console.log(this.deleteEntree.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.entreeService.deleteMouvementTicketEntree(this.deleteEntree.value).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.deleteEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_entree');
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
          console.error('Erreur lors de la supression de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadVehicules(): void {
    this.entreeService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data; // Stocker la liste des vehicules
      },
      error: (err) => {
        console.error("Erreur lors du chargement des véhicules :", err);
      }
    });
  }
  loadEmployes(): void {
    this.entreeService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data; // Stocker la liste des employes
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employes :", err);
      }
    });
  }
  loadCouponTickets(): void {
    this.entreeService.getAllCouponTickets().subscribe({
      next: (data) => {
        this.couponTickets = data; // Stocker la liste des couponTickets
      },
      error: (err) => {
        console.error("Erreur lors du chargement des couponTickets :", err);
      }
    });
  }
  loadCompagniesPetrolieres(): void {
    this.entreeService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data; // Stocker la liste des compagniePetrolieres
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagniePetrolieres :", err);
      }
    });
  }


  loadEntrees(): void {
    this.entreeService.getAllMouvementTicketEntree().subscribe(
      (data: MouvementTicket[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Ticket Entree', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(entre =>
      entre.description.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editEntree.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      objet: row.objet,
      description: row.description,
      qte: row.qte,
      date: this.convertToNgbDate(row.date),
    })
  }


  // id: number;
  // vehicule_id: number;
  // compagnie_petrolier_id: number;
  // coupon_ticket_id: number;
  // employe_id: number;
  // description: string;
  // objet: string;
  // id_type_mouvement: number;
  // kilometrage: number;
  // qte: number;
  // date: string;
  // created_at: string;
  // updated_at: string;

  getDeleteForm(row: any) {
    this.deleteEntree.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer YYYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

}


