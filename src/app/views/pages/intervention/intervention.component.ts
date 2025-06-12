import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsService } from '../../../core/services/intervention/intervention.service';
import { Immobilisation, TypeIntervention, Intervention } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms"; // Ajouté FormArray
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-intervention',
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
    FeatherIconDirective

  ],
  templateUrl: 'intervention.component.html'
})
export class InterventionComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: Intervention[] = [];
  temp: Intervention[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addIntervention!: FormGroup;
  public editIntervention!: FormGroup;
  public deleteIntervention!: FormGroup;

  immobilisations: Immobilisation[] = []; // Liste des immos
  typeInterventions: TypeIntervention[] = []; // Liste des types d'intervention

  // NOUVELLE PROPRIÉTÉ POUR GÉRER L'ÉTAT DE SOUMISSION
  isAddingIntervention: boolean = false; // Pour l'ajout d'une intervention


  @ViewChild('table') table!: DatatableComponent;

  constructor(private interventionService: InterventionsService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadImmobilisations();
    this.loadtypeInterventions();
    this.loadInterventions();

    this.addIntervention = this.formBuilder.group({
      immo_id: [null, [Validators.required]],
      type_intervention_id: [null, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      cout: ["", [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0) pour le coût
    });
    this.editIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
      immo_id: [null, [Validators.required]], // Changé de 0 à null pour la cohérence avec les sélecteurs
      type_intervention_id: [null, [Validators.required]], // Changé de 0 à null
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      cout: ["", [Validators.required, Validators.min(0)]],
    });
    this.deleteIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }
  onClickSubmitAddIntervention() {
    // console.log('onClickSubmitAddIntervention appelé. isAddingIntervention:', this.isAddingIntervention); // Commenté

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingIntervention) {
      // console.warn('Soumission multiple détectée pour Intervention. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-intervention'); // Assurez-vous que ce sélecteur correspond à votre HTML

    if (this.addIntervention.valid) {
      this.isAddingIntervention = true; // Désactiver le bouton
      // console.log('isAddingIntervention mis à true.'); // Commenté

      if (spinner) {
        spinner.classList.remove('d-none');
        // console.log('Spinner Intervention affiché.'); // Commenté
      }

      const formData = {
        ...this.addIntervention.value,
        date_intervention: this.formatDate(this.addIntervention.value.date_intervention), // Convertir la date
      };
      this.interventionService.saveIntervention(formData).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.addIntervention.reset();
          this.isAddingIntervention = false; // Réactiver le bouton
          // console.log('Soumission Intervention réussie. isAddingIntervention mis à false.'); // Commenté

          // Fermer le modal manuellement
          const modal = document.getElementById('add_intervention');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingIntervention = false; // Réactiver le bouton en cas d'erreur
          // console.error('Soumission Intervention échouée. isAddingIntervention mis à false.'); // Commenté
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addIntervention); // Marquer les champs comme touchés pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné");
      // console.log('Formulaire Intervention invalide.'); // Commenté
    }
  }

  onClickSubmitEditIntervention() {
    // console.log(this.editIntervention.value); // Commenté
    const spinner = document.querySelector('.spinnerModif');

    // NOTE: Il serait bon d'avoir une propriété isEditingIntervention: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isEditingIntervention = true; // Ajoutez ceci
    if (this.editIntervention.valid) {
      if (spinner) spinner.classList.remove('d-none');
      // const id = this.editIntervention.value.id; // Non utilisé, peut être supprimé
      const formData = {
        ...this.editIntervention.value,
        date_intervention: this.formatDate(this.editIntervention.value.date_intervention), // Convertir la date
      };
      this.interventionService.editIntervention(formData).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.editIntervention.reset();
          // this.isEditingIntervention = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_intervention');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertModifVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertModifVisible); // Commenté
            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la modification de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isEditingIntervention = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.editIntervention); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteIntervention() {
    // console.log(this.deleteIntervention.value); // Commenté
    const spinner = document.querySelector('.spinnerDelete');

    // NOTE: Il serait bon d'avoir une propriété isDeletingIntervention: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isDeletingIntervention = true; // Ajoutez ceci
    if (this.deleteIntervention.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.interventionService.deleteIntervention(this.deleteIntervention.value).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.deleteIntervention.reset();
          // this.isDeletingIntervention = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_intervention');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertSuppVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertSuppVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la supression de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isDeletingIntervention = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  loadInterventions(): void {
    this.interventionService.getAllInterventions().subscribe(
      (data: Intervention[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Interventions', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(intervention =>
  //     intervention.titre.toLowerCase().includes(val) ||
  //     intervention.observation.toLowerCase().includes(val) ||
  //     intervention.date_intervention.toLowerCase().includes(val) ||
  //     // Vérifier si l'objet imbriqué existe avant d'accéder à ses propriétés
  //     (intervention.immobilisation && intervention.immobilisation.designation.toLowerCase().includes(val)) ||
  //     (intervention.type_intervention && intervention.type_intervention.libelle_type_intervention.toLowerCase().includes(val))
  //   );

  //   this.table.offset = 0;
  // }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(intervention =>
      intervention.titre.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editIntervention.patchValue({
      id: row.id,
      immo_id: row.immo_id,
      type_intervention_id: row.type_intervention_id,
      titre: row.titre,
      observation: row.observation,
      date_intervention: this.convertToNgbDate(row.date_intervention),
      cout: row.cout,
    })
  }

  getDeleteForm(row: any) {
    this.deleteIntervention.patchValue({
      id: row.id,
    })
  }

  loadImmobilisations(): void {
    this.interventionService.getAllImmobilisations().subscribe({
      next: (data) => {
        this.immobilisations = data; // Stocker la liste des immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }
  loadtypeInterventions(): void {
    this.interventionService.getAllTypeInterventions().subscribe({
      next: (data) => {
        this.typeInterventions = data; // Stocker la liste des typeInterventions
      },
      error: (err) => {
        console.error("Erreur lors du chargement des typeInterventions :", err);
      }
    });
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

  downloadInterventionsPDF(): void {
    this.interventionService.imprimerInterventions().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_interventions.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des interventions:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }

}