import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TransfertsService } from '../../../core/services/transfert/transfert.service';
import { InterventionsService } from '../../../core/services/intervention/intervention.service';
import { Immobilisation, TypeIntervention, Intervention, Transfert, Bureau, Employe } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-transfert',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
    // FeatherIconDirective
  ],
  templateUrl: 'transfert.component.html'
})
export class TransfertComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: Transfert[] = [];
  temp: Transfert[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp


  public addTransfert!: FormGroup;
  public editTransfert!: FormGroup;
  public deleteTransfert!: FormGroup;

  immobilisations: Immobilisation[] = []; // Liste des immos
  bureaux: Bureau[] = []; // Liste des Bureaux,
  employes: Employe[] = []; // Liste des Employes,







  @ViewChild('table') table!: DatatableComponent;

  constructor(private transfertService: TransfertsService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadImmobilisations();
    this.loadEmployes();
    this.loadBureaux();
    this.loadTransferts();

    this.addTransfert = this.formBuilder.group({
      immo_id: [null, [Validators.required]],
      old_bureau_id: [ []],
      old_employe_id: [ []],
      bureau_id: [null, [Validators.required]],
      employe_id: [null, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      observation: ["", []],
    });
    this.editTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
      immo_id: [null, [Validators.required]],
      old_bureau_id: [null, []],
      old_employe_id: [null, []],
      bureau_id: [null, [Validators.required]],
      employe_id: [null, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      observation: ["", []],
    });
    this.deleteTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }
  onClickSubmitAddTransfert() {
    console.log(this.addTransfert.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addTransfert.value,
        date_mouvement: this.formatDate(this.addTransfert.value.date_mouvement), // Convertir la date
      };
      this.transfertService.saveTransfert(formData).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.addTransfert.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_transfert');
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
          console.error('Erreur lors de l\'ajout du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditTransfert() {
    console.log(this.editTransfert.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editTransfert.value.id;
      this.transfertService.editTransfert(this.editTransfert.value).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.editTransfert.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_transfert');
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
          console.error('Erreur lors de la modification du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteTransfert() {
    console.log(this.deleteTransfert.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.transfertService.deleteTransfert(this.deleteTransfert.value).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.deleteTransfert.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_transfert');
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
          console.error('Erreur lors de la supression du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadTransferts(): void {
    this.transfertService.getAllTransferts().subscribe(
      (data: Transfert[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Transferts', error);
        this.loadingIndicator = false;
      }
    );
  }




  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(transfert =>
      transfert.date_mouvement.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editTransfert.patchValue({
      id: row.id,
      immo_id: row.immo_id,
      type_intervention_id: row.type_intervention_id,
      titre: row.titre,
      observation: row.observation,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
      cout: row.cout,
    })
  }

  getDeleteForm(row: any) {
    this.deleteTransfert.patchValue({
      id: row.id,
    })
  }

  loadImmobilisations(): void {
    this.transfertService.getAllImmobilisations().subscribe({
      next: (data) => {
        this.immobilisations = data; // Stocker la liste des immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }
  loadEmployes(): void {
    this.transfertService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data; // Stocker la liste des Employés
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }
  loadBureaux(): void {
    this.transfertService.getAllBureaux().subscribe({
      next: (data) => {
        this.bureaux = data; // Stocker la liste des bureaux
      },
      error: (err) => {
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }

  updateOldInfo() {
    const idImmo = this.addTransfert.get('immo_id')?.value;
    console.log('ID de l\'IMMO sélectionné:', idImmo);
    if (!idImmo) {
      console.log('Aucun article sélectionné ou désélection effectuée');
      return;
    }
    this.transfertService.getOldInfo(idImmo).subscribe(
      (response) => {
        console.log('Info Récupérée:',response);
        // this.oldBureau=response.bureau;
        // this.oldEmploye=response.employe;
        // console.log('employe:', this.oldEmploye);
        // console.log('bureau:', this.oldBureau);

        this.addTransfert.patchValue({
          old_bureau_id: response.bureau,
          old_employe_id: response.employe
        });
      },
      (error) => {
        console.error('Erreur lors des Infos:', error);
      }
    );
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

  //   updateQuantiteDisponible() {
  //     const idArticle = this.addSortie.get('id_Article')?.value;
  //     console.log('ID de l\'article sélectionné:', idArticle);

  //     if (!idArticle) {
  //       console.log('Aucun article sélectionné ou désélection effectuée');
  //       this.quantiteDisponible = 0;
  //       return;
  //     }

  //     this.sortieService.getQuantiteDisponible(idArticle).subscribe(
  //       (response) => {
  //         console.log('Quantité disponible:', response.data);
  //         this.quantiteDisponible = response.data;

  //         //  On met à jour le validateur max du champ qte
  //     const qteControl = this.addSortie.get('qte');
  //     qteControl?.setValidators([
  //       Validators.required,
  //       Validators.min(1),
  //       Validators.max(this.quantiteDisponible)
  //     ]);
  //     qteControl?.updateValueAndValidity();

  //       },
  //       (error) => {
  //         console.error('Erreur lors de la récupération de la quantité disponible:', error);
  //         this.quantiteDisponible = 0;
  //       }
  //     );

  // }

}


