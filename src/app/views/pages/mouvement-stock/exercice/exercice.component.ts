import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ExerciceService } from '../../../../core/services/exercice/exercice.service';
import { Exercice } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,AbstractControl,ValidationErrors  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';



declare var bootstrap: any;
import { Router } from '@angular/router';

@Component({
  selector: 'app-exercice',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    MyNgSelectComponent
  ],
  templateUrl: 'exercice.component.html'
})
export class ExerciceComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  today: NgbDateStruct = inject(NgbCalendar).getToday();
  firstDayOfYear: NgbDateStruct;
  lastDayOfYear: NgbDateStruct;

  rows: Exercice[] = [];
  temp: Exercice[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  // Ajoutez ces propriétés pour la gestion du modal de confirmation
  showConfirmationModal = false;
  confirmationMessage = '';
  exerciceToChangeStatusId: number | null = null;
  newStatus: 'ouvert' | 'cloture' | null = null;


  public addExercice!: FormGroup;
  public editExercice!: FormGroup;
  public deleteExercice!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private exerciceService: ExerciceService, private formBuilder: FormBuilder, private router: Router) {
    const currentYear = this.today.year;
    this.firstDayOfYear = { year: currentYear, month: 1, day: 1 };
    this.lastDayOfYear = { year: currentYear, month: 12, day: 31 };
        this.addExercice = this.formBuilder.group({
            date_debut: [this.firstDayOfYear, Validators.required],
            date_fin: [this.lastDayOfYear, Validators.required],
        });
        this.editExercice = this.formBuilder.group({
            id: [0, [Validators.required]],
            date_debut: [this.firstDayOfYear, Validators.required],
            date_fin: [this.lastDayOfYear, Validators.required],
            statut: ["", []],
        });
  }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadExercice();
    }

    this.addExercice = this.formBuilder.group(
      {
        date_debut: [this.firstDayOfYear, Validators.required],
        date_fin: [this.lastDayOfYear, Validators.required],
      },
      {
        validators: [this.sameYearValidator.bind(this)]
      }
    );

    // This call needs to be outside the formBuilder.group() method
    this.setupDateObservers();

  this.editExercice = this.formBuilder.group(
    {
      id: [0, [Validators.required]],
      date_debut: ["", []],
      date_fin: ["", []],
      statut: ["", []],
    },
    {
      // Ajoutez le validateur ici
      validators: [this.sameYearValidator.bind(this)]
    }
  );
    // Appel de la nouvelle fonction pour le formulaire d'édition
  this.setupEditDateObservers();
  }

  // Enforce that start and end dates are in the same year
  sameYearValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('date_debut')?.value;
    const end = control.get('date_fin')?.value;

    if (!start || !end) {
      return null; // Don't validate if dates are not selected yet.
    }

    // NgbDateStruct's year property is already a number
    const startYear = start.year;
    const endYear = end.year;

    if (startYear !== endYear) {
      // Return an error if the years are different
      return { sameYear: true };
    }

    // Return null if the years are the same (valid)
    return null;
  }

  setupDateObservers(): void {
    // Observe changes on the 'date_debut' field
    this.addExercice.get('date_debut')?.valueChanges.subscribe(date_debut => {
      if (date_debut) {
        // Force the date_debut to the first day of the year selected
        const firstDayOfYear = { year: date_debut.year, month: 1, day: 1 };
        this.addExercice.get('date_debut')?.setValue(firstDayOfYear, { emitEvent: false });

        // Update the 'date_fin' field with the last day of the same year
        this.addExercice.get('date_fin')?.setValue(
          { year: date_debut.year, month: 12, day: 31 },
          { emitEvent: false } // Avoid an infinite update loop
        );
      }
    });

    // Observe changes on the 'date_fin' field
    this.addExercice.get('date_fin')?.valueChanges.subscribe(date_fin => {
      if (date_fin) {
        // Force the date_fin to the last day of the year selected
        const lastDayOfYear = { year: date_fin.year, month: 12, day: 31 };
        this.addExercice.get('date_fin')?.setValue(lastDayOfYear, { emitEvent: false });

        // Update the 'date_debut' field with the first day of the same year
        this.addExercice.get('date_debut')?.setValue(
          { year: date_fin.year, month: 1, day: 1 },
          { emitEvent: false } // Avoid an infinite update loop
        );
      }
    });
  }

  // Créez une nouvelle méthode dans votre classe de composant
  setupEditDateObservers(): void {
    // Observez les changements sur le champ `date_debut` du formulaire d'édition
    this.editExercice.get('date_debut')?.valueChanges.subscribe(date_debut => {
      if (date_debut) {
        // Force the date_debut to the first day of the year selected
        const firstDayOfYear = { year: date_debut.year, month: 1, day: 1 };
        this.editExercice.get('date_debut')?.setValue(firstDayOfYear, { emitEvent: false });

        // Update the 'date_fin' field with the last day of the same year
        this.editExercice.get('date_fin')?.setValue(
          { year: date_debut.year, month: 12, day: 31 },
          { emitEvent: false } // Avoid an infinite update loop
        );
      }
    });

    // Observez les changements sur le champ `date_fin` du formulaire d'édition
    this.editExercice.get('date_fin')?.valueChanges.subscribe(date_fin => {
      if (date_fin) {
        // Force the date_fin to the last day of the year selected
        const lastDayOfYear = { year: date_fin.year, month: 12, day: 31 };
        this.editExercice.get('date_fin')?.setValue(lastDayOfYear, { emitEvent: false });

        // Update the 'date_debut' field with the first day of the same year
        this.editExercice.get('date_debut')?.setValue(
          { year: date_fin.year, month: 1, day: 1 },
          { emitEvent: false } // Avoid an infinite update loop
        );
      }
    });
  }

  // 🔥 NOUVELLE MÉTHODE : Initialiser les permissions
  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return; // Garder les permissions par défaut (true)
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      // 🔥 VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
      this.canVoirParamStock = allowedFonctionnalites.includes('Voir Parametres Stock');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamStock;

      console.log('🔐 Permissions calculées:', {
        canVoirParamStock: this.canVoirParamStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de Exercice');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
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

  onClickSubmitAddExercice() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de Exercice déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addExercice.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addExercice.invalid) {
      this.markFormGroupTouched(this.addExercice); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    const formData = {
      ...this.addExercice.value,
      date_debut: this.formatDate(this.addExercice.value.date_debut), // Convertir la date
      date_fin: this.formatDate(this.addExercice.value.date_fin), // Convertir la date
    };

    this.exerciceService.saveExercice(formData).subscribe({
      next: (data: any) => {
        this.loadExercice();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addExercice.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_exercice');
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
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout du Exercice :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditExercice() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de Exercice déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editExercice.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editExercice.invalid) {
      this.markFormGroupTouched(this.editExercice);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editExercice.value.id;

    const formData = {
      ...this.editExercice.value,
      date_debut: this.formatDate(this.editExercice.value.date_debut), // Convertir la date
      date_fin: this.formatDate(this.editExercice.value.date_fin), // Convertir la date
    };

    this.exerciceService.editExercice(formData).subscribe({
      next: (data: any) => {
        this.loadExercice();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editExercice.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_exercice');
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
      error: (error: any) => {
        console.error('Erreur lors de la modification du Exercice :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteExercice() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de Exercice déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteExercice.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteExercice.invalid) {
      this.markFormGroupTouched(this.deleteExercice);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.exerciceService.deleteExercice(this.deleteExercice.value).subscribe({
      next: (data: any) => {
        this.loadExercice();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteExercice.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_exercice');
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
        console.error('Erreur lors de la supression du Exercice :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }


  loadExercice(): void {
    this.exerciceService.getAllExercice().subscribe(
      (data: Exercice[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Exercice', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(exercice =>
      exercice.annee.toString().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editExercice.patchValue({
      id: row.id,
      date_debut: this.convertToNgbDate(row.date_debut),
      date_fin: this.convertToNgbDate(row.date_fin),
      statut: row.statut,
    })
  }

  getDeleteForm(row: any) {
    this.deleteExercice.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }

  clotureExercice(id: number) {
  if (confirm("Êtes-vous sûr de vouloir clôturer cet exercice ?")) {
    this.exerciceService.editExercice({ id: id, statut: 'cloture' }).subscribe({
      next: () => this.loadExercice(),
      error: (error) => console.error("Erreur lors de la clôture de l'exercice :", error)
    });
  }
}

ouvrirExercice(id: number) {
  if (confirm("Êtes-vous sûr de vouloir ouvrir cet exercice ? L'exercice actuel sera clôturé.")) {
    // Note: La logique pour clôturer les autres exercices est dans le backend
    this.exerciceService.editExercice({ id: id, statut: 'ouvert' }).subscribe({
      next: () => this.loadExercice(),
      error: (error) => console.error("Erreur lors de l'ouverture de l'exercice :", error)
    });
  }
}

  openClotureConfirmation(rowId: number) {
  this.exerciceToChangeStatusId = rowId;
  this.newStatus = 'cloture';
  this.confirmationMessage = "Êtes-vous sûr de vouloir clôturer cet exercice ?";
  this.showConfirmationModal = true;
}

  // Cette méthode remplace l'appel direct à `ouvrirExercice` depuis le template
  openOuvrirConfirmation(rowId: number) {
    this.exerciceToChangeStatusId = rowId;
    this.newStatus = 'ouvert';
    this.confirmationMessage = "Êtes-vous sûr de vouloir ouvrir cet exercice ? L'exercice actuel sera clôturé.";
    this.showConfirmationModal = true;
  }

    // Cette méthode est appelée par le bouton de confirmation du modal
  confirmStatusChange() {
    if (this.exerciceToChangeStatusId !== null && this.newStatus !== null) {
      this.exerciceService.updateExercice({ id: this.exerciceToChangeStatusId, statut: this.newStatus }).subscribe({
        next: () => {
          this.loadExercice();
          this.closeConfirmationModal();
        },
        error: (error) => {
          console.error("Erreur lors de la modification du statut :", error);
          this.closeConfirmationModal();
        }
      });
    }
  }

    closeConfirmationModal() {
    this.showConfirmationModal = false;
    this.exerciceToChangeStatusId = null;
    this.newStatus = null;
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
