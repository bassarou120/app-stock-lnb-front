import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CompagniePetroliereService } from '../../../../core/services/compagnie-petroliere/compagnie-petroliere.service';
import { CompagniePetroliere } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-compagnie-petroliere',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'compagnie-petroliere.component.html'
})
export class CompagniePetroliereComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamParc: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: CompagniePetroliere[] = [];
  temp: CompagniePetroliere[] = [];
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

  public addCompagniePetroliere!: FormGroup ;
  public editCompagniePetroliere!: FormGroup ;
  public deleteCompagniePetroliere!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private compagniePetroliereService: CompagniePetroliereService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    this.loadCompagniePetrolieres();
    this.addCompagniePetroliere = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.editCompagniePetroliere = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.deleteCompagniePetroliere = this.formBuilder.group({
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
      this.canVoirParamParc = allowedFonctionnalites.includes('Voir Parametres Parc');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamParc;

      console.log('🔐 Permissions calculées:', {
        canVoirParamParc: this.canVoirParamParc,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de parc');
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

  onClickSubmitAddCompagniePetroliere() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de compagnie pétrolière déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addCompagniePetroliere.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addCompagniePetroliere.invalid) {
      this.markFormGroupTouched(this.addCompagniePetroliere); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.compagniePetroliereService.saveCompagniePetroliere(this.addCompagniePetroliere.value).subscribe({
      next: (data: any) => {
        this.loadCompagniePetrolieres();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_compagniePetroliere');
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
        console.error('Erreur lors de l\'ajout de la Compagnie Petroliere :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditCompagniePetroliere(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de compagnie pétrolière déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editCompagniePetroliere.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editCompagniePetroliere.invalid) {
      this.markFormGroupTouched(this.editCompagniePetroliere);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editCompagniePetroliere.value.id;
    this.compagniePetroliereService.editCompagniePetroliere(this.editCompagniePetroliere.value).subscribe({
      next: (data: any) => {
        this.loadCompagniePetrolieres();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_compagniePetroliere');
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
        console.error('Erreur lors de la modification de la Compagnie Petroliere :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteCompagniePetroliere(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de compagnie pétrolière déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteCompagniePetroliere.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteCompagniePetroliere.invalid) {
      this.markFormGroupTouched(this.deleteCompagniePetroliere);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.compagniePetroliereService.deleteCompagniePetroliere(this.deleteCompagniePetroliere.value).subscribe({
      next: (data: any) => {
        this.loadCompagniePetrolieres();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_compagniePetroliere');
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
        console.error('Erreur lors de la suppression de la Compagnie Petroliere :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

  // --- Nouvelle propriété pour gérer l'état de téléchargement ---
  isDownloading: boolean = false;
  // -------------------------------------------------------------

  downloadCompagnie() {
    // 1. Vérifier si un téléchargement est déjà en cours
    if (this.isDownloading) {
      console.warn('Téléchargement déjà en cours. Opération annulée.');
      return;
    }

    // 2. Activer l'indicateur de chargement
    this.isDownloading = true;

    this.compagniePetroliereService.imprimerCompagnies().subscribe({
      next: (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_compagnies_petrolieres.pdf'; // Nom du fichier à télécharger
        a.click();
      },
      error: error => {
        console.error('Erreur lors du téléchargement du PDF', error);
        alert('Une erreur s\'est produite lors du téléchargement du PDF. Veuillez réessayer.');
      },
      complete: () => {
        // 3. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDownloading = false;
      }
    });
  }

loadCompagniePetrolieres(): void {
    this.compagniePetroliereService.getAllCompagniePetrolieres().subscribe(
      (data: CompagniePetroliere[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des CompagniePetroliere', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(compagniePetroliere =>
      compagniePetroliere.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editCompagniePetroliere.patchValue({
     id:row.id,
     libelle:row.libelle,
     adresse:row.adresse
    })
  }

  getDeleteForm(row: any){
    this.deleteCompagniePetroliere.patchValue({
     id:row.id,
    })
  }
}