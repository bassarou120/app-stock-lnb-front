import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeImmoService } from '../../../../core/services/type-immo/type-immo.service';
import { TypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-type-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'type-immo.component.html'
})
export class TypeImmoComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamImmo: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: TypeImmo[] = [];
  temp: TypeImmo[] = [];
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

  public addTypeImmo!: FormGroup ;
  public editTypeImmo!: FormGroup ;
  public deleteTypeImmo!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeImmoService: TypeImmoService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    this.loadTypeImmos();
    this.addTypeImmo = this.formBuilder.group({
      libelle_typeImmo: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.editTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_typeImmo: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.deleteTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
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

  onClickSubmitAddTypeImmo() {
    console.log(this.addTypeImmo.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addTypeImmo.invalid) {
      this.markFormGroupTouched(this.addTypeImmo); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.typeImmoService.saveTypeImmo(this.addTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeImmo');
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
        console.error('Erreur lors de l\'ajout du type d\'immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditTypeImmo(){
    console.log(this.editTypeImmo.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editTypeImmo.invalid) {
      this.markFormGroupTouched(this.editTypeImmo);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editTypeImmo.value.id;
    this.typeImmoService.editTypeImmo(this.editTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeImmo');
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
        console.error('Erreur lors de la modification du type d\'Immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteTypeImmo(){
    console.log(this.deleteTypeImmo.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteTypeImmo.invalid) {
      this.markFormGroupTouched(this.deleteTypeImmo);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.typeImmoService.deleteTypeImmo(this.deleteTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeImmo');
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
        console.error('Erreur lors de la suppression du Type d\'Immo :', error);
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
    this.typeImmoService.getAllTypeImmos().subscribe(
      (data: TypeImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Typeq d\'Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeImmo =>
      typeImmo.libelle_typeImmo.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeImmo.patchValue({
     id:row.id,
     libelle_typeImmo:row.libelle_typeImmo,
     compte:row.compte,
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeImmo.patchValue({
     id:row.id,
    })
  }
}