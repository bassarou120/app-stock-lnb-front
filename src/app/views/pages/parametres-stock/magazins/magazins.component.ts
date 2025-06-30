import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MagazinsService } from '../../../../core/services/magazins/magazins.service';
import { Magazin } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;
import { Router } from '@angular/router';

@Component({
  selector: 'app-magazins',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'magazins.component.html'
})
export class MagazinsComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Magazin[] = [];
  temp: Magazin[] = [];
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

  public addMagazin!: FormGroup ;
  public editMagazin!: FormGroup ;
  public deleteMagazin!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private magazinsService: MagazinsService, private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    
    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadMagazins();
    }

    this.addMagazin = this.formBuilder.group({
      libelle_magazin: ["", [Validators.required]],
      localisation: ["", [Validators.required]],
   });
    this.editMagazin = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_magazin: ["", [Validators.required]],
      localisation: ["", [Validators.required]],
   });
    this.deleteMagazin = this.formBuilder.group({
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
      this.canVoirParamStock = allowedFonctionnalites.includes('Voir Parametres Stock');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamStock;

      console.log('🔐 Permissions calculées:', {
        canVoirParamStock: this.canVoirParamStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de stock');
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

  onClickSubmitAddMagazin() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de magasin déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addMagazin.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addMagazin.invalid) {
      this.markFormGroupTouched(this.addMagazin); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.magazinsService.saveMagazin(this.addMagazin.value).subscribe({
      next: (data: any) => {
        this.loadMagazins();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_magazin');
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
        console.error('Erreur lors de l\'ajout du magasin :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditMagazin(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de magasin déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editMagazin.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editMagazin.invalid) {
      this.markFormGroupTouched(this.editMagazin);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editMagazin.value.id;
    this.magazinsService.editMagazin(this.editMagazin.value).subscribe({
      next: (data: any) => {
        this.loadMagazins();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_magazin');
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
        console.error('Erreur lors de la modification du magasin :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteMagazin(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de magasin déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteMagazin.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteMagazin.invalid) {
      this.markFormGroupTouched(this.deleteMagazin);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.magazinsService.deleteMagazin(this.deleteMagazin.value).subscribe({
      next: (data: any) => {
        this.loadMagazins();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_magazin');
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
        console.error('Erreur lors de la suppression du magasin :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }


loadMagazins(): void {
    this.magazinsService.getAllMagazins().subscribe(
      (data: Magazin[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Magazin', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(magazin =>
      magazin.libelle_magazin.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editMagazin.patchValue({
     id:row.id,
     libelle_magazin:row.libelle_magazin,
     localisation:row.localisation
    })
  }

  getDeleteForm(row: any){
    this.deleteMagazin.patchValue({
     id:row.id,
    })
  }
}