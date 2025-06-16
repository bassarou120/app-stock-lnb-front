import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeInterventionService } from '../../../../core/services/types-intervention/types-intervention.service';
import { TypeIntervention } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct  } from '@ng-bootstrap/ng-bootstrap';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-types-intervention',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    NgbTooltipModule 
  ],
  templateUrl: 'types-intervention.component.html'
})
export class TypesInterventionComponent implements OnInit {

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: TypeIntervention[] = [];
  temp: TypeIntervention[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  
  alertModifVisible: boolean = false;  
  alertSuppVisible: boolean = false; 

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    
  isEditing: boolean = false;   
  isDeleting: boolean = false;  
  // -----------------------------------------------------------

  public addTypeIntervention!: FormGroup ;
  public editTypeIntervention!: FormGroup ;
  public deleteTypeIntervention!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeInterventionService: TypeInterventionService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
  this.loadTypeInterventions();
  this.initForms(); // Appeler une méthode pour initialiser les formulaires
}

initForms(): void {
  // Formulaire d'ajout
  this.addTypeIntervention = this.formBuilder.group({
    libelle_type_intervention: ["", [Validators.required]],
    applicable_seul_vehicule: [0, [Validators.required]], // Valeur par défaut 0 (false)
    observation: ["", []],
    has_expiration_date: [false], // Nouvelle propriété pour la checkbox
    date_expiration: [null] // Initialiser à null, le validateur sera ajouté/retiré
  });

  // Écouter les changements sur 'has_expiration_date' pour le formulaire d'ajout
  this.addTypeIntervention.get('has_expiration_date')?.valueChanges.subscribe(hasExpiration => {
    const dateExpirationControl = this.addTypeIntervention.get('date_expiration');
    if (dateExpirationControl) {
      if (hasExpiration) {
        dateExpirationControl.setValidators(Validators.required);
      } else {
        dateExpirationControl.clearValidators();
        dateExpirationControl.patchValue(null); // Vider la valeur si la checkbox est décochée
      }
      dateExpirationControl.updateValueAndValidity(); // Mettre à jour la validité
    }
  });


  // Formulaire d'édition
  this.editTypeIntervention = this.formBuilder.group({
    id: [0, [Validators.required]],
    libelle_type_intervention: ["", [Validators.required]],
    applicable_seul_vehicule: [0, [Validators.required]], // Valeur par défaut 0
    observation: ["", []],
    has_expiration_date: [false], // Nouvelle propriété pour la checkbox
    date_expiration: [null] // Initialiser à null
  });

  // Écouter les changements sur 'has_expiration_date' pour le formulaire d'édition
  this.editTypeIntervention.get('has_expiration_date')?.valueChanges.subscribe(hasExpiration => {
    const dateExpirationControl = this.editTypeIntervention.get('date_expiration');
    if (dateExpirationControl) {
      if (hasExpiration) {
        dateExpirationControl.setValidators(Validators.required);
      } else {
        dateExpirationControl.clearValidators();
        dateExpirationControl.patchValue(null); // Vider la valeur si la checkbox est décochée
      }
      dateExpirationControl.updateValueAndValidity();
    }
  });

  // Formulaire de suppression (pas de changement ici)
  this.deleteTypeIntervention = this.formBuilder.group({
    id: [0, [Validators.required]],
  });
}

  // --- MÉTHODE UTILITAIRE POUR MARQUER TOUS LES CONTRÔLES DE FORMULAIRE COMME TOUCHÉS ---
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  // ---------------------------------------------------------------------

    onClickSubmitAddTypeIntervention() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    // Si la checkbox 'has_expiration_date' est cochée, 'date_expiration' doit être valide.
    // Si elle n'est pas cochée, 'date_expiration' doit être null et le validateur retiré.
    // Le `updateValueAndValidity()` dans le `valueChanges` s'en charge.
    if (this.addTypeIntervention.invalid) {
      this.markFormGroupTouched(this.addTypeIntervention);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;

    const formData = { ...this.addTypeIntervention.value };

    // Formatage de la date d'expiration si elle existe et est définie
    if (formData.has_expiration_date && formData.date_expiration) {
      formData.date_expiration = this.formatDate(formData.date_expiration);
    } else {
      formData.date_expiration = null; // Assurez-vous que c'est null si non applicable
    }

    // Retirer la propriété 'has_expiration_date' du formData car le backend n'en a pas besoin
    delete formData.has_expiration_date;

    this.typeInterventionService.saveTypeIntervention(formData).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions();
        this.addTypeIntervention.reset();
        // Réinitialiser les valeurs par défaut et l'état de la checkbox
        this.addTypeIntervention.patchValue({
          applicable_seul_vehicule: 0, // Réinitialiser à 0 par défaut
          has_expiration_date: false // Réinitialiser à false par défaut
        });
        // S'assurer que le validateur de date_expiration est retiré après reset
        this.addTypeIntervention.get('date_expiration')?.clearValidators();
        this.addTypeIntervention.get('date_expiration')?.updateValueAndValidity();


        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeIntervention');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout de l\'intervention :', error);
        alert('Une erreur s\'est produite lors de l\'ajout. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

    onClickSubmitEditTypeIntervention() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editTypeIntervention.invalid) {
      this.markFormGroupTouched(this.editTypeIntervention);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;

    const formData = { ...this.editTypeIntervention.value };

    // Formatage de la date d'expiration si elle existe et est définie
    if (formData.has_expiration_date && formData.date_expiration) {
      formData.date_expiration = this.formatDate(formData.date_expiration);
    } else {
      formData.date_expiration = null; // Assurez-vous que c'est null si non applicable
    }

    // Retirer la propriété 'has_expiration_date' du formData
    delete formData.has_expiration_date;

    const id = this.editTypeIntervention.value.id;
    this.typeInterventionService.editTypeIntervention(formData).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions();
        this.editTypeIntervention.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeIntervention');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du Type Intervention :', error);
        alert('Une erreur s\'est produite lors de la modification. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteTypeIntervention(){
    console.log(this.deleteTypeIntervention.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteTypeIntervention.invalid) {
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.typeInterventionService.deleteTypeIntervention(this.deleteTypeIntervention.value).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteTypeIntervention.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeIntervention');
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
      error: (error: any) => {
        console.error('Erreur lors de la supression du Type Intervention :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
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

    loadTypeInterventions(): void {
      this.typeInterventionService.getAllTypeInterventions().subscribe(
        (data: TypeIntervention[]) => {
          this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
          this.rows = data;
          this.loadingIndicator = false;
        },
        error => {
          console.error('Erreur lors du chargement des Type Interventions', error);
          this.loadingIndicator = false;
        }
      );
    }

    updateFilter(event: KeyboardEvent): void {
      const val = (event.target as HTMLInputElement).value.toLowerCase();

      this.rows = this.temp.filter(typeIntervention =>
        typeIntervention.libelle_type_intervention.toLowerCase().includes(val)
      );

      this.table.offset = 0;
    }

    getEditForm(row: any) {
      // Déterminer si le champ date_expiration a une valeur pour initialiser la checkbox
      const hasExpiration = row.date_expiration !== null && row.date_expiration !== undefined && row.date_expiration !== '';

      this.editTypeIntervention.patchValue({
        id: row.id,
        libelle_type_intervention: row.libelle_type_intervention,
        applicable_seul_vehicule: row.applicable_seul_vehicule ? 1 : 0,
        observation: row.observation,
        has_expiration_date: hasExpiration, // Initialiser la nouvelle checkbox
        date_expiration: this.convertToNgbDate(row.date_expiration) // Convertir la date si elle existe, sinon null
      });

      // Mettre à jour les validateurs après patchValue pour s'assurer de la bonne application
      const dateExpirationControl = this.editTypeIntervention.get('date_expiration');
      if (dateExpirationControl) {
          if (hasExpiration) {
              dateExpirationControl.setValidators(Validators.required);
          } else {
              dateExpirationControl.clearValidators();
          }
          dateExpirationControl.updateValueAndValidity();
      }
    }

    getDeleteForm(row: any){
      this.deleteTypeIntervention.patchValue({
      id:row.id,
      })
    }

    onCheckboxChange(event: any) {
      this.addTypeIntervention.patchValue({
        applicable_seul_vehicule: event.target.checked ? 1 : 0
      });
    }

    onCheckboxEditChange(event: any) {
      this.editTypeIntervention.patchValue({
        applicable_seul_vehicule: event.target.checked ? 1 : 0
      });
    }
  }