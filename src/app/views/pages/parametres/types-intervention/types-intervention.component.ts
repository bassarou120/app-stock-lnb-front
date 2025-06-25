import { Component, ViewChild, OnInit } from '@angular/core'; // `inject` et `NgbCalendar` sont retirés
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeInterventionService } from '../../../../core/services/types-intervention/types-intervention.service';
import { TypeIntervention } from '../../../../core/services/interface/models'; 
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common'; // DatePipe n'est plus strictement nécessaire si vous ne formatez pas de dates spécifiques, mais je le garde au cas où d'autres usages subsistent dans le template.
import { NgbAlertModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'; // NgbDatepickerModule et NgbDateStruct sont retirés
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

declare var bootstrap: any; // Pour les modales Bootstrap

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
    NgbTooltipModule,
    // DatePipe // Commenté si non utilisé ailleurs pour le nettoyage des imports
  ],
  templateUrl: 'types-intervention.component.html'
})
export class TypesInterventionComponent implements OnInit {

  // currentDate: NgbDateStruct = inject(NgbCalendar).getToday(); // Rétiré, plus de datepicker direct
  rows: TypeIntervention[] = [];
  temp: TypeIntervention[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false; 
  alertModifVisible: boolean = false; 
  alertSuppVisible: boolean = false; 

  // Indicateurs pour gérer les soumissions simultanées et les spinners
  isAdding: boolean = false; 
  isEditing: boolean = false; 
  isDeleting: boolean = false; 

  public addTypeIntervention!: FormGroup;
  public editTypeIntervention!: FormGroup;
  public deleteTypeIntervention!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private typeInterventionService: TypeInterventionService,
    private formBuilder: FormBuilder,
    // private datePipe: DatePipe // Commenté si non utilisé ailleurs pour le nettoyage des imports
  ) {}

  ngOnInit(): void {
    this.loadTypeInterventions();
    this.initForms();
  }

  // Initialise les formulaires réactifs
  initForms(): void {
    // Le champ date_expiration est maintenu dans le FormGroup mais ne sera jamais affiché/manipulé par l'UI.
    // Sa valeur sera fixée à null lors de la soumission.
    this.addTypeIntervention = this.formBuilder.group({
      libelle_type_intervention: ["", [Validators.required]],
      // applicable_seul_vehicule sera traité comme un booléen (true/false) pour les checkboxes Angular
      // Le backend (via $casts) convertira correctement true/false en 1/0 ou vice-versa.
      applicable_seul_vehicule: [false, [Validators.required]], 
      observation: ["", []],
      // has_expiration_date sera également traité comme un booléen
      has_expiration_date: [false], 
      date_expiration: [null] // Gardé dans le formGroup, mais toujours nullé à l'envoi
    });

    // Supprime les écouteurs de changements de valeur qui manipulaient la date_expiration.
    // Cette logique n'est plus nécessaire puisque le champ de date est supprimé.
    // this.addTypeIntervention.get('has_expiration_date')?.valueChanges.subscribe(...);


    this.editTypeIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_type_intervention: ["", [Validators.required]],
      applicable_seul_vehicule: [false, [Validators.required]],
      observation: ["", []],
      has_expiration_date: [false],
      date_expiration: [null]
    });

    // Supprime les écouteurs de changements de valeur pour l'édition également.
    // this.editTypeIntervention.get('has_expiration_date')?.valueChanges.subscribe(...);

    this.deleteTypeIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  // Marque tous les contrôles d'un FormGroup comme touchés pour déclencher l'affichage des erreurs
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Charge la liste des types d'intervention depuis le service
  loadTypeInterventions(): void {
    this.loadingIndicator = true;
    this.typeInterventionService.getAllTypeInterventions().subscribe(
      (data: TypeIntervention[]) => {
        // Le `map` n'est plus nécessaire ici car `has_expiration_date` est maintenant un champ direct du backend
        // et son type est déjà `boolean` grâce à l'interface TypeIntervention et aux casts Laravel.
        this.rows = data; 
        this.temp = [...this.rows]; // Sauvegarde pour le filtrage local
        this.loadingIndicator = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des types d\'intervention :', error);
        this.loadingIndicator = false;
      }
    );
  }

  // Prépare le formulaire d'édition avec les données de la ligne sélectionnée
  getEditForm(row: TypeIntervention): void {
    this.editTypeIntervention.patchValue({
      id: row.id,
      libelle_type_intervention: row.libelle_type_intervention,
      // Les valeurs booléennes sont directement patchées
      applicable_seul_vehicule: row.applicable_seul_vehicule,
      observation: row.observation,
      has_expiration_date: row.has_expiration_date, // Directement depuis l'objet du backend
      date_expiration: null // Toujours null dans le formulaire puisque le champ de date n'est pas affiché
    });
    // Pas besoin de mettre à jour les validateurs car date_expiration n'est plus requis par l'UI.
  }

  // Prépare le formulaire de suppression avec l'ID de la ligne sélectionnée
  getDeleteForm(row: TypeIntervention): void {
    this.deleteTypeIntervention.patchValue({
      id: row.id
    });
  }

  // Gère la soumission du formulaire d'ajout
  onClickSubmitAddTypeIntervention() {
    if (this.isAdding) {
      console.warn('Ajout de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    if (this.addTypeIntervention.invalid) {
      this.markFormGroupTouched(this.addTypeIntervention);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    this.isAdding = true; // Active le spinner et désactive le bouton

    const formData = { ...this.addTypeIntervention.value };

    // Strictement selon votre demande : le champ date_expiration est toujours null pour le backend.
    formData.date_expiration = null;
    
    // has_expiration_date est maintenant une propriété du modèle qui sera envoyée.
    // Nous ne la supprimons plus ici, elle sera envoyée telle quelle (true/false) au service.

    this.typeInterventionService.saveTypeIntervention(formData).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions(); // Recharge les données du tableau
        this.addTypeIntervention.reset(); // Réinitialise le formulaire
        // Réinitialise les checkboxes à false après l'ajout pour les prochains ajouts
        this.addTypeIntervention.patchValue({
          applicable_seul_vehicule: false,
          has_expiration_date: false 
        });

        const modal = document.getElementById('add_typeIntervention');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertAjoutVisible = true;
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout de l\'intervention :', error);
        alert('Une erreur s\'est produite lors de l\'ajout. Veuillez réessayer.');
      },
      complete: () => {
        this.isAdding = false;
      }
    });
  }

  // Gère la soumission du formulaire d'édition
  onClickSubmitEditTypeIntervention() {
    if (this.isEditing) {
      console.warn('Modification de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    if (this.editTypeIntervention.invalid) {
      this.markFormGroupTouched(this.editTypeIntervention);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    this.isEditing = true;

    const formData = { ...this.editTypeIntervention.value };

    // Strictement selon votre demande : le champ date_expiration est toujours null pour le backend.
    formData.date_expiration = null;
    
    // has_expiration_date est une propriété du modèle qui sera envoyée.
    // Nous ne la supprimons plus ici, elle sera envoyée telle quelle (true/false) au service.

    const id = this.editTypeIntervention.value.id;
    this.typeInterventionService.editTypeIntervention(formData).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions();
        this.editTypeIntervention.reset();

        const modal = document.getElementById('edit_typeIntervention');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertModifVisible = true;
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du Type Intervention :', error);
        alert('Une erreur s\'est produite lors de la modification. Veuillez réessayer.');
      },
      complete: () => {
        this.isEditing = false;
      }
    });
  }

  // Gère la soumission du formulaire de suppression
  onClickSubmitDeleteTypeIntervention() {
    if (this.isDeleting) {
      console.warn('Suppression de type d\'intervention déjà en cours. Opération annulée.');
      return;
    }

    if (this.deleteTypeIntervention.invalid) {
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    this.isDeleting = true;

    this.typeInterventionService.deleteTypeIntervention(this.deleteTypeIntervention.value).subscribe({
      next: (data: any) => {
        this.loadTypeInterventions();
        this.deleteTypeIntervention.reset();

        const modal = document.getElementById('delete_typeIntervention');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertSuppVisible = true;
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du Type Intervention :', error);
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        this.isDeleting = false;
      }
    });
  }

  // Méthode de filtrage pour le tableau ngx-datatable
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeIntervention =>
      (typeIntervention.libelle_type_intervention?.toLowerCase().includes(val) || false) ||
      (typeIntervention.observation?.toLowerCase().includes(val) || false) || 
      (typeIntervention.applicable_seul_vehicule ? 'oui' : 'non').includes(val) || 
      (typeIntervention.has_expiration_date ? 'oui' : 'non').includes(val) 
    );

    if (this.table) {
      this.table.offset = 0;
    }
  }

  // Les méthodes onCheckboxChange et onCheckboxEditChange ne sont plus nécessaires car
  // les checkboxes Angular gèrent directement les valeurs booléennes via formControlName.
  // Vous pouvez les supprimer si elles ne sont pas appelées ailleurs dans votre code.
  // onCheckboxChange(event: any) { ... }
  // onCheckboxEditChange(event: any) { ... }
}
