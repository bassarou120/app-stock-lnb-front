import { Component, ViewChild, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { SousTypeImmoService } from '../../../../core/services/sous-type-immo/sous-type-immo.service';
import { SousTypeImmo, TypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
declare var bootstrap: any;
import { Router } from '@angular/router';

@Component({
  selector: 'app-sous-type-immo',
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
  templateUrl: 'sous-type-immo.component.html'
})
export class SousTypeImmoComponent implements OnInit, OnDestroy {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamImmo: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: SousTypeImmo[] = [];
  temp: SousTypeImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  typeImmos: TypeImmo[] = []; // Liste des types d'immos
  selectedTypeImmoId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addSousTypeImmo!: FormGroup;
  public editSousTypeImmo!: FormGroup;
  public deleteSousTypeImmo!: FormGroup;

  private baseCompteAjout: string = '';
  private baseCompteEdit: string = '';
  private ngUnsubscribe = new Subject<void>();

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('soustypeImmoCompte', { static: false }) compteInput!: ElementRef; // Référence à l'input d'ajout
  @ViewChild('editSoustypeImmoCompte', { static: false }) editCompteInput!: ElementRef; // Référence à l'input d'édition


  constructor(private sousTypeImmoService: SousTypeImmoService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();


    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadTypeImmos();
        this.loadSousTypeImmos();
    }


    this.addSousTypeImmo = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      id_type_immo: [null, [Validators.required]],
      compte: ["", [Validators.required]],
    });
    this.editSousTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_type_immo: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      compte: ["", [Validators.required]],
    });
    this.deleteSousTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    // Écouter les changements de la sélection du type d'immobilisation dans le formulaire d'ajout
    this.addSousTypeImmo.get('id_type_immo')?.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(selectedTypeId => {
      const selectedType = this.typeImmos.find(type => type.id === selectedTypeId);
      if (selectedType && selectedType.compte) {
        this.baseCompteAjout = selectedType.compte.toString();
        this.addSousTypeImmo.patchValue({ compte: this.baseCompteAjout });
      } else {
        this.baseCompteAjout = '';
        this.addSousTypeImmo.patchValue({ compte: '' });
      }
    });

    // Écouter les changements du champ compte dans le formulaire d'ajout
    this.addSousTypeImmo.get('compte')?.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(currentValue => {
      if (this.baseCompteAjout && currentValue && currentValue.length < this.baseCompteAjout.length && currentValue !== this.baseCompteAjout) {
        this.addSousTypeImmo.patchValue({ compte: this.baseCompteAjout }, { emitEvent: false });
      }
    });

    // Écouter les changements de la sélection du type d'immobilisation dans le formulaire d'édition
    this.editSousTypeImmo.get('id_type_immo')?.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(selectedTypeId => {
      const selectedType = this.typeImmos.find(type => type.id === selectedTypeId);
      if (selectedType && selectedType.compte) {
        this.baseCompteEdit = selectedType.compte.toString();
        this.editSousTypeImmo.patchValue({ compte: this.baseCompteEdit });
      } else {
        this.baseCompteEdit = '';
        this.editSousTypeImmo.patchValue({ compte: '' });
      }
    });

    // Écouter les changements du champ compte dans le formulaire d'édition
    this.editSousTypeImmo.get('compte')?.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(currentValue => {
      if (this.baseCompteEdit && currentValue && currentValue.length < this.baseCompteEdit.length && currentValue !== this.baseCompteEdit) {
        this.editSousTypeImmo.patchValue({ compte: this.baseCompteEdit }, { emitEvent: false });
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
      this.canVoirParamImmo = allowedFonctionnalites.includes('Voir Parametres Immo');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamImmo;

      console.log('🔐 Permissions calculées:', {
        canVoirParamImmo: this.canVoirParamImmo,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages d\'immo');
        // Optionnel: redirection automatique
        // this.router.navigate(['/dashboard']);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }


  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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

  onClickSubmitAddSousTypeImmo() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de sous-type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addSousTypeImmo.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addSousTypeImmo.invalid) {
      this.markFormGroupTouched(this.addSousTypeImmo); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.sousTypeImmoService.saveSousTypeImmo(this.addSousTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadSousTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_sousTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout du sous type d\'immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditSousTypeImmo() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de sous-type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editSousTypeImmo.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editSousTypeImmo.invalid) {
      this.markFormGroupTouched(this.editSousTypeImmo);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editSousTypeImmo.value.id;
    this.sousTypeImmoService.editSousTypeImmo(this.editSousTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadSousTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_sousTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du sous type d\'Immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteSousTypeImmo() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de sous-type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteSousTypeImmo.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteSousTypeImmo.invalid) {
      this.markFormGroupTouched(this.deleteSousTypeImmo);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.sousTypeImmoService.deleteSousTypeImmo(this.deleteSousTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadSousTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_sousTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du sous Type d\'Immo :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

  loadTypeImmos(): void {
    this.sousTypeImmoService.getAllTypeImmos().subscribe({
      next: (data) => {
        this.typeImmos = data; // Stocker la liste des types d'immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des types d'immos :", err);
      }
    });
  }


  loadSousTypeImmos(): void {
    this.sousTypeImmoService.getAllSousTypeImmos().subscribe(
      (data: SousTypeImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Sous Type d\'Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(sousTypeImmo =>
      sousTypeImmo.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editSousTypeImmo.patchValue({
      id: row.id,
      id_type_immo: row.id_type_immo,
      libelle: row.libelle,
      compte: row.compte,
    });
  }

  getDeleteForm(row: any) {
    this.deleteSousTypeImmo.patchValue({
      id: row.id,
    });
  }
}