import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsVehiculeService } from '../../../core/services/interventionvehicules/interventionvehicules.service';
// Assurez-vous que le chemin est correct et que Commune est bien importée
import { InterventionVehicule, TypeIntervention, Vehicule, Commune } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule, DatePipe } from '@angular/common'; // Ajout de DatePipe
// Import de NgbDate pour la conversion des dates si nécessaire (bien que NgbDateStruct soit plus couramment utilisé avec NgbDatepicker)
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
// Correction de l'import pour NgSelectComponent, il faut importer le module complet
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';


declare var bootstrap: any;

@Component({
  selector: 'app-intervention-vehicule',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgSelectModule, // Utiliser NgSelectModule
    NgbDatepickerModule,
    FeatherIconDirective,
    DatePipe // Ajout de DatePipe pour le formatage dans le template
  ],
  templateUrl: 'interventionvehicules.component.html'
})

export class InterventionVehiculeComponent implements OnInit {
  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddInterventionVehicule: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canModifyInterventionVehicule: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canDeleteInterventionVehicule: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canViewInterventionVehicule: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: InterventionVehicule[] = [];
  temp: InterventionVehicule[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addInterventionVehicule!: FormGroup;
  public editInterventionVehicule!: FormGroup;
  public deleteInterventionVehicule!: FormGroup;

  vehicules: Vehicule[] = [];
  communes: Commune[] = []; // Gardé si utilisé ailleurs, mais pas directement dans cette logique
  typeInterventions: TypeIntervention[] = []; // Liste complète des types d'intervention avec has_expiration_date
  intervention_vehicule: InterventionVehicule[] = [];

  // NOUVELLES PROPRIÉTÉS POUR GÉRER L'ÉTAT DE SOUMISSION
  isAddingInterventionVehicule: boolean = false;
  isEditingInterventionVehicule: boolean = false;
  isDeletingInterventionVehicule: boolean = false;

  // NOUVEAU: Propriétés pour la gestion de l'affichage conditionnel de date_expiration
  showExpirationDateInput: boolean = false; // Pour la modale d'ajout
  editShowExpirationDateInput: boolean = false; // Pour la modale d'édition
  // 🔥 NOUVELLE PROPRIÉTÉ pour stocker l'intervention véhicule sélectionnée
  public selectedInterventionVehicule: any = null;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private interventionVehiculeService: InterventionsVehiculeService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {

    this.initializePermissions();
    if (this.hasPageAccess) {
      console.log('ngOnInit: Démarrage du chargement des données...');
      this.loadVehicules();
      this.loadCommunes();
      this.loadInterventionVehicules();
      this.loadInterventions_vehicule();
      this.loadtypeInterventions(); // Charger les types d'intervention, essentiel pour `has_expiration_date`
      this.initForms(); // Appeler une méthode pour initialiser les formulaires
    }
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
      this.canAddInterventionVehicule = allowedFonctionnalites.includes('Ajout Intervention vehicule');
      this.canModifyInterventionVehicule = allowedFonctionnalites.includes('Modification Intervention vehicule');
      this.canDeleteInterventionVehicule = allowedFonctionnalites.includes('Suppression Intervention vehicule');
      this.canViewInterventionVehicule= allowedFonctionnalites.includes('Voir intervention vehicule');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewInterventionVehicule ;


      console.log('🔐 Permissions calculées:', {
        canAddInterventionVehicule: this.canAddInterventionVehicule,
        canModifyInterventionVehicule: this.canModifyInterventionVehicule,
        canDeleteInterventionVehicule: this.canDeleteInterventionVehicule
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

    // ✅ AJOUTER cette méthode
  getViewForm(row: any) {
    this.selectedInterventionVehicule = row;
    console.log('Intervention véhicule sélectionnée:', row);
  }

  // Méthode pour initialiser les formulaires
  initForms(): void {
    this.addInterventionVehicule = this.formBuilder.group({
      vehicule_id: [null, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: [this.currentDate, [Validators.required]], // Date par défaut
      montant: ["", [Validators.required, Validators.min(0)]],
      type_intervention_id: [null, [Validators.required]],
      date_expiration: [null], // Initialisé à null, son validateur et visibilité seront gérés dynamiquement
    });

    // Écouter les changements sur le champ type_intervention_id pour le formulaire d'ajout
    // L'événement `(change)` de ng-select passe la valeur directement, pas un objet Event.
    // Donc, `typeId` est déjà l'ID.
    this.addInterventionVehicule.get('type_intervention_id')?.valueChanges.subscribe((typeId: number) => {
      console.log('addInterventionVehicule: type_intervention_id changed to', typeId);
      this.handleTypeInterventionChange(typeId, 'add');
    });

    this.editInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: [this.currentDate, [Validators.required]], // Date par défaut
      montant: ["", [Validators.required, Validators.min(0)]],
      type_intervention_id: [null, [Validators.required]],
      date_expiration: [null], // Initialisé à null, son validateur et visibilité seront gérés dynamiquement
    });

    // Écouter les changements sur le champ type_intervention_id pour le formulaire d'édition
    this.editInterventionVehicule.get('type_intervention_id')?.valueChanges.subscribe((typeId: number) => {
      console.log('editInterventionVehicule: type_intervention_id changed to', typeId);
      this.handleTypeInterventionChange(typeId, 'edit');
    });

    this.deleteInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  // Gère la logique d'affichage et de validation de la date d'expiration
  // typeId peut être directement l'ID (number) ou l'objet complet du ng-select
  handleTypeInterventionChange(eventOrId: any, formType: 'add' | 'edit'): void {
    let typeId: number | null = null;

    // Déterminer l'ID réel à partir de l'événement ng-select
    if (typeof eventOrId === 'number') { // Si c'est directement l'ID (via valueChanges)
      typeId = eventOrId;
    } else if (eventOrId && typeof eventOrId === 'object' && eventOrId.id !== undefined) {
      // Si c'est l'objet complet envoyé par (change) de ng-select (avec bindValue="id")
      typeId = eventOrId.id;
    } else {
      typeId = null; // Gérer les cas où la valeur est undefined, null ou un type inattendu
    }

    console.log(`handleTypeInterventionChange: Called for formType: ${formType}, resolved typeId: ${typeId}`);

    const selectedType = this.typeInterventions.find(type => type.id === typeId);
    console.log('handleTypeInterventionChange: Selected Type from array:', selectedType);
    console.log('handleTypeInterventionChange: has_expiration_date for selected type:', selectedType?.has_expiration_date);

    const dateExpirationControl = formType === 'add' ?
      this.addInterventionVehicule.get('date_expiration') :
      this.editInterventionVehicule.get('date_expiration');

    if (dateExpirationControl) {
      if (selectedType?.has_expiration_date) {
        console.log(`handleTypeInterventionChange: ${formType} - Setting date_expiration as visible and required.`);
        // Si le type d'intervention a une date d'expiration, afficher le champ et le rendre requis
        if (formType === 'add') {
          this.showExpirationDateInput = true;
        } else {
          this.editShowExpirationDateInput = true;
        }
        dateExpirationControl.setValidators(Validators.required);
      } else {
        console.log(`handleTypeInterventionChange: ${formType} - Hiding date_expiration, clearing value and validators.`);
        // Sinon, masquer le champ, vider sa valeur et retirer les validateurs
        if (formType === 'add') {
          this.showExpirationDateInput = false;
        } else {
          this.editShowExpirationDateInput = false;
        }
        dateExpirationControl.clearValidators();
        dateExpirationControl.patchValue(null); // Vider la valeur si la date d'expiration n'est pas requise
      }
      dateExpirationControl.updateValueAndValidity(); // Mettre à jour la validité du contrôle
      console.log(`handleTypeInterventionChange: ${formType} - date_expiration control validity updated. Current status:`, dateExpirationControl.status);
    } else {
        console.warn(`handleTypeInterventionChange: date_expiration control not found for ${formType} form.`);
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

  loadInterventionVehicules(): void {
    console.log('loadInterventionVehicules: Chargement des interventions véhicules...');
    this.interventionVehiculeService.getAllInterventionsVehicule().subscribe(
      (data: InterventionVehicule[]) => {
        console.log('loadInterventionVehicules: Données reçues:', data);
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Interventions des véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }

  onClickSubmitAddInterventionVehicule() {
    console.log('onClickSubmitAddInterventionVehicule: Tentative d\'ajout...');
    if (this.isAddingInterventionVehicule) {
      console.warn('Soumission multiple détectée pour Intervention Véhicule. Annulation.');
      return;
    }

    if (this.addInterventionVehicule.invalid) {
      this.markFormGroupTouched(this.addInterventionVehicule);
      console.error('Formulaire d\'ajout invalide. Erreurs:', this.addInterventionVehicule.errors, 'Controls:', this.addInterventionVehicule.controls);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    this.isAddingInterventionVehicule = true;

    const formData = {
      ...this.addInterventionVehicule.value,
      // Convertir NgbDateStruct en string 'YYYY-MM-DD'
      date_intervention: this.formatDate(this.addInterventionVehicule.value.date_intervention),
      // Gérer date_expiration: la convertir si elle est présente et requise, sinon null
      date_expiration: this.addInterventionVehicule.value.date_expiration ?
                       this.formatDate(this.addInterventionVehicule.value.date_expiration) : null
    };
    console.log('onClickSubmitAddInterventionVehicule: Données à envoyer:', formData);

    this.interventionVehiculeService.saveInterventionVehicule(formData).subscribe(
      (data: any) => {
        console.log('onClickSubmitAddInterventionVehicule: Ajout réussi:', data);
        this.loadInterventionVehicules();
        this.addInterventionVehicule.reset();
        this.isAddingInterventionVehicule = false;

        // Réinitialiser les champs de date par défaut et masquer/vider date_expiration
        this.addInterventionVehicule.patchValue({
          date_intervention: this.currentDate, // Réinitialiser à la date actuelle
          vehicule_id: null, // Réinitialiser le select
          type_intervention_id: null, // Réinitialiser le select
          observation: "",
          titre: "",
          montant: "",
          date_expiration: null // Vider la date d'expiration après l'ajout
        });
        this.showExpirationDateInput = false; // Masquer le champ de date d'expiration après reset
        this.addInterventionVehicule.get('date_expiration')?.clearValidators(); // Retirer les validateurs
        this.addInterventionVehicule.get('date_expiration')?.updateValueAndValidity(); // Mettre à jour la validité


        const modal = document.getElementById('add_intervention_vehicule');
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
        console.error('Erreur lors de l\'ajout de l\'intervention du véhicule :', error);
        this.isAddingInterventionVehicule = false;
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  }

  onClickSubmitEditInterventionVehicule() {
    console.log('onClickSubmitEditInterventionVehicule: Tentative d\'édition...');
    if (this.isEditingInterventionVehicule) {
      console.warn('Soumission multiple détectée pour édition Intervention Véhicule. Annulation.');
      return;
    }

    if (this.editInterventionVehicule.invalid) {
      this.markFormGroupTouched(this.editInterventionVehicule);
      console.error('Formulaire d\'édition invalide. Erreurs:', this.editInterventionVehicule.errors, 'Controls:', this.editInterventionVehicule.controls);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return;
    }

    this.isEditingInterventionVehicule = true;
    const formData = {
      ...this.editInterventionVehicule.value,
      date_intervention: this.formatDate(this.editInterventionVehicule.value.date_intervention),
      date_expiration: this.editInterventionVehicule.value.date_expiration ?
                       this.formatDate(this.editInterventionVehicule.value.date_expiration) : null
    };
    console.log('onClickSubmitEditInterventionVehicule: Données à envoyer:', formData);


    this.interventionVehiculeService.editInterventionVehicule(formData).subscribe(
      (data: any) => {
        console.log('onClickSubmitEditInterventionVehicule: Édition réussie:', data);
        this.loadInterventionVehicules();
        this.editInterventionVehicule.reset();
        this.isEditingInterventionVehicule = false;

        // Masquer le champ de date d'expiration après reset
        this.editShowExpirationDateInput = false;
        this.editInterventionVehicule.get('date_expiration')?.clearValidators(); // Retirer les validateurs
        this.editInterventionVehicule.get('date_expiration')?.updateValueAndValidity(); // Mettre à jour la validité

        const modal = document.getElementById('edit_intervention_vehicule');
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
        console.error('Erreur lors de la modification de l\'intervention du véhicule :', error);
        this.isEditingInterventionVehicule = false;
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  }

  onClickSubmitDeleteInterventionVehicule() {
    console.log('onClickSubmitDeleteInterventionVehicule: Tentative de suppression...');
    if (this.isDeletingInterventionVehicule) {
      console.warn('Soumission multiple détectée pour suppression Intervention Véhicule. Annulation.');
      return;
    }

    if (this.deleteInterventionVehicule.invalid) {
      console.error('Formulaire de suppression invalide. Erreurs:', this.deleteInterventionVehicule.errors, 'Controls:', this.deleteInterventionVehicule.controls);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    this.isDeletingInterventionVehicule = true;
    console.log('onClickSubmitDeleteInterventionVehicule: ID à supprimer:', this.deleteInterventionVehicule.value.id);

    this.interventionVehiculeService.deleteInterventionVehicule(this.deleteInterventionVehicule.value).subscribe(
      (data: any) => {
        console.log('onClickSubmitDeleteInterventionVehicule: Suppression réussie:', data);
        this.loadInterventionVehicules();
        this.deleteInterventionVehicule.reset();
        this.isDeletingInterventionVehicule = false;

        const modal = document.getElementById('delete_intervention_vehicule');
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
        console.error('Erreur lors de la suppression de l\'intervention du véhicule :', error);
        this.isDeletingInterventionVehicule = false;
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  }

  // updateFilter amélioré pour inclure la date d'expiration
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    console.log('updateFilter: Filtering with value:', val);

    this.rows = this.temp.filter(interventionVehicule =>
      (interventionVehicule.titre?.toLowerCase().includes(val) || false) ||
      (interventionVehicule.observation?.toLowerCase().includes(val) || false) ||
      (interventionVehicule.vehicule?.immatriculation?.toLowerCase().includes(val) || false) ||
      (String(interventionVehicule.montant).toLowerCase().includes(val) || false) ||
      (interventionVehicule.typeIntervention?.libelle_type_intervention?.toLowerCase().includes(val) || false) ||
      // Filtrer aussi par la date d'expiration si elle est présente et le type d'intervention a has_expiration_date
      (interventionVehicule.typeIntervention?.has_expiration_date && interventionVehicule.date_expiration ?
         this.formatDate(this.convertToNgbDate(interventionVehicule.date_expiration) as NgbDateStruct)?.toLowerCase().includes(val) : false) ||
      // Filtrer par la date d'intervention
      (interventionVehicule.date_intervention ? this.formatDate(this.convertToNgbDate(interventionVehicule.date_intervention) as NgbDateStruct)?.toLowerCase().includes(val) : false)
    );
    console.log('updateFilter: Filtered rows count:', this.rows.length);

    if (this.table) {
      this.table.offset = 0;
    }
  }

  // Prépare le formulaire d'édition
  getEditForm(row: InterventionVehicule) {
    console.log('getEditForm: Préparation du formulaire d\'édition pour la ligne:', row);
    // IMPORTANT: Assurez-vous que row.typeIntervention est chargé (eager loading dans Laravel)
    // ou chargez-le manuellement si ce n'est pas le cas.
    // L'existence de `row.typeIntervention?.has_expiration_date` est clé ici.
    console.log('getEditForm: row.typeIntervention:', row.typeIntervention);
    console.log('getEditForm: row.typeIntervention?.has_expiration_date:', row.typeIntervention?.has_expiration_date);

    this.editShowExpirationDateInput = !!row.typeIntervention?.has_expiration_date;
    console.log('getEditForm: Initial editShowExpirationDateInput set to:', this.editShowExpirationDateInput);


    this.editInterventionVehicule.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      titre: row.titre,
      observation: row.observation,
      date_intervention: this.convertToNgbDate(row.date_intervention), // Convertir pour le datepicker
      montant: row.montant,
      type_intervention_id: row.type_intervention_id,
      // Patch la date d'expiration si elle doit être affichée ET existe, sinon null
      date_expiration: this.editShowExpirationDateInput && row.date_expiration ? this.convertToNgbDate(row.date_expiration) : null,
    });
    console.log('getEditForm: Formulaire d\'édition patché avec les valeurs:', this.editInterventionVehicule.value);


    // Déclenche la logique pour date_expiration après le patchValue initial
    // Ceci s'assurera que les validateurs sont bien mis à jour.
    this.handleTypeInterventionChange(row.type_intervention_id, 'edit');
    console.log('getEditForm: Appel de handleTypeInterventionChange après patchValue.');
  }

  getDeleteForm(row: any) {
    console.log('getDeleteForm: Préparation du formulaire de suppression pour la ligne:', row);
    this.deleteInterventionVehicule.patchValue({
      id: row.id,
    })
  }

    // 🔥 MÉTHODE pour calculer les jours depuis l'intervention
  getDaysSinceIntervention(dateIntervention: string): number {
    if (!dateIntervention) return 0;
    
    const interventionDate = new Date(dateIntervention);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - interventionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

    // 🔥 MÉTHODE pour calculer les jours jusqu'à expiration
  getDaysUntilExpiration(dateExpiration: string): number {
    if (!dateExpiration) return 0;
    
    const expirationDate = new Date(dateExpiration);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

    // 🔥 MÉTHODE pour vérifier si l'intervention est expirée
  isInterventionExpired(dateExpiration: string): boolean {
    if (!dateExpiration) return false;
    return this.getDaysUntilExpiration(dateExpiration) < 0;
  }

  // 🔥 MÉTHODE pour programmer un suivi (optionnel)
  programmerSuivi(intervention: any): void {
    console.log('Programmation d\'un suivi pour l\'intervention:', intervention);
    // Vous pouvez implémenter cette méthode selon vos besoins
    // Par exemple, ouvrir un modal de planification ou rediriger vers une page de suivi
    alert('Fonctionnalité de programmation de suivi à implémenter');
  }

    // 🔥 MÉTHODE pour obtenir la couleur du badge selon l'état du véhicule
  getVehiculeEtatBadgeClass(etat: string): string {
    switch (etat?.toLowerCase()) {
      case 'bon':
        return 'bg-success';
      case 'moyen':
        return 'bg-warning text-dark';
      case 'mauvais':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  
  // 🔥 MÉTHODE pour obtenir l'icône selon le type d'intervention
  getInterventionTypeIcon(typeIntervention: string): string {
    const type = typeIntervention?.toLowerCase() || '';
    
    if (type.includes('maintenance')) return 'icon-settings';
    if (type.includes('réparation')) return 'icon-tool';
    if (type.includes('contrôle') || type.includes('visite')) return 'icon-check-circle';
    if (type.includes('assurance')) return 'icon-shield';
    if (type.includes('carburant')) return 'icon-zap';
    
    return 'icon-truck'; // Icône par défaut
  }

    // 🔥 MÉTHODE pour formater le kilométrage
  formatKilometrage(km: number): string {
    if (!km) return 'N/A';
    return new Intl.NumberFormat('fr-FR').format(km) + ' km';
  }

  // 🔥 MÉTHODES UTILITAIRES À AJOUTER
getDaysExpiredSince(dateExpiration: string): number {
  if (!dateExpiration) return 0;
  
  const expirationDate = new Date(dateExpiration);
  const today = new Date();
  const diffTime = today.getTime() - expirationDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

    // 🔥 NOUVELLE MÉTHODE pour obtenir la valeur absolue
  getAbsoluteDays(days: number): number {
    return Math.abs(days);
  }

    // 🔥 MÉTHODE pour imprimer le rapport d'intervention véhicule (optionnel)
  imprimerInterventionVehicule(intervention: any): void {
    console.log('Impression du rapport d\'intervention véhicule:', intervention);
    // Vous pouvez appeler votre service d'impression ici
    // this.interventionVehiculeService.imprimerInterventionVehicule(intervention.id).subscribe(...);
    window.print();
  }

  loadInterventions_vehicule(): void {
    this.interventionVehiculeService.getAllInterventions_vehicule().subscribe({
      next: (data) => {
        this.intervention_vehicule = data; // Stocker la liste des interventions immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }

  loadVehicules(): void {
    console.log('loadVehicules: Chargement des véhicules...');
    this.interventionVehiculeService.getAllVehicules().subscribe({
      next: (data) => {
        console.log('loadVehicules: Données véhicules reçues:', data);
        this.vehicules = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des véhicules :", err);
      }
    });
  }

  loadtypeInterventions(): void {
    console.log('loadtypeInterventions: Chargement des types d\'intervention...');
    this.interventionVehiculeService.getAllTypeInterventions().subscribe({
      next: (data) => {
        console.log('loadtypeInterventions: Données typeInterventions reçues:', data);
        this.typeInterventions = data; // Stocker la liste des typeInterventions avec has_expiration_date
      },
      error: (err) => {
        console.error("Erreur lors du chargement des typeInterventions :", err);
      }
    });
  }

  loadCommunes(): void {
    console.log('loadCommunes: Chargement des communes...');
    this.interventionVehiculeService.getAllCommunes().subscribe({
      next: (data) => {
        console.log('loadCommunes: Données communes reçues:', data);
        this.communes = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
      }
    });
  }

  // Convertit NgbDateStruct en string 'YYYY-MM-DD'
  formatDate(date: NgbDateStruct | string | null): string | null { // Ajout de `| null`
    if (!date) return null;
    if (typeof date === 'string') { // Si c'est déjà une chaîne, la retourner telle quelle
      return date;
    }
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string | null): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  downloadInterventionsVehiculePDF(): void {
    console.log('downloadInterventionsVehiculePDF: Tentative de téléchargement du PDF...');
    this.interventionVehiculeService.imprimerInterventionsVehicule().subscribe(
      (response: Blob) => {
        console.log('downloadInterventionsVehiculePDF: PDF reçu, taille:', response.size);
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_interventions_vehicule.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        console.log('downloadInterventionsVehiculePDF: PDF téléchargé avec succès.');
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des interventions de véhicule:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }

  getTypeInterventionLibelle(intervention: any): string {
    // Essayer différentes structures de données
    if (intervention.type_intervention?.libelle_type_intervention) {
      return intervention.type_intervention.libelle_type_intervention;
    }
    if (intervention.typeIntervention?.libelle_type_intervention) {
      return intervention.typeIntervention.libelle_type_intervention;
    }
    // Fallback: chercher dans la liste des types
    const typeIntervention = this.typeInterventions.find(t => t.id === intervention.type_intervention_id);
    return typeIntervention?.libelle_type_intervention || 'N/A';
  }
}
