import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { FournisseursService } from '../../../../core/services/fournisseurs/fournisseurs.service';
import { Fournisseur } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'fournisseurs.component.html'
})
export class FournisseursComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamGeneraux: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres 

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages 

  rows: Fournisseur[] = [];
  temp: Fournisseur[] = [];
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

  public addFournisseur!: FormGroup ;
  public editFournisseur!: FormGroup ;
  public deleteFournisseur!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private fournisseurService: FournisseursService, private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    
    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadFournisseurs();
    }

    this.addFournisseur = this.formBuilder.group({
      nom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.editFournisseur = this.formBuilder.group({
      id: [0, [Validators.required]],
      nom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.deleteFournisseur = this.formBuilder.group({
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
      this.canVoirParamGeneraux = allowedFonctionnalites.includes('Voir Parametres Généraux');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamGeneraux;

      console.log('🔐 Permissions calculées:', {
        canVoirParamGeneraux: this.canVoirParamGeneraux,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages generaux');
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

  onClickSubmitAddFournisseur() {
    console.log(this.addFournisseur.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de fournisseur déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addFournisseur.invalid) {
      this.markFormGroupTouched(this.addFournisseur); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.fournisseurService.saveFournisseur(this.addFournisseur.value).subscribe({
      next: (data: any) => {
        this.loadFournisseurs();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_fournisseur');
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
        console.error('Erreur lors de l\'ajout du Fournisseur :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditFournisseur(){
    console.log(this.editFournisseur.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de fournisseur déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editFournisseur.invalid) {
      this.markFormGroupTouched(this.editFournisseur);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editFournisseur.value.id;
    this.fournisseurService.editFournisseur(this.editFournisseur.value).subscribe({
      next: (data: any) => {
        this.loadFournisseurs();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_fournisseur');
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
        console.error('Erreur lors de la modification de la Fournisseur :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteFournisseur(){
    console.log(this.deleteFournisseur.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de fournisseur déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteFournisseur.invalid) {
      this.markFormGroupTouched(this.deleteFournisseur);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.fournisseurService.deleteFournisseur(this.deleteFournisseur.value).subscribe({
      next: (data: any) => {
        this.loadFournisseurs();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_fournisseur');
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
        console.error('Erreur lors de la suppression du Fournisseur :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }


loadFournisseurs(): void {
    this.fournisseurService.getAllFournisseurs().subscribe(
      (data: Fournisseur[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Fournisseurs', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(fournisseur =>
      fournisseur.nom.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editFournisseur.patchValue({
     id:row.id,
     nom:row.nom,
     telephone:row.telephone,
     adresse:row.adresse

    })
  }

  getDeleteForm(row: any){
    this.deleteFournisseur.patchValue({
     id:row.id,
    })
  }

  downloadFournisseurs() {
    this.fournisseurService.imprimerFournisseurs().subscribe((response: Blob) => {
      const fileURL = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = fileURL;
      a.download = 'liste_fournisseurs.pdf'; // Nom du fichier à télécharger
      a.click();
    }, error => {
      console.error('Erreur lors du téléchargement du PDF', error);
    });
  }
}