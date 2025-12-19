import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CommunesService } from '../../../../core/services/communes/communes.service';
import { Commune } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-communes',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule 
  ],
  templateUrl: 'communes.component.html'
})
export class CommunesComponent implements OnInit {

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamParc: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Commune[] = [];
  temp: Commune[] = [];
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

  public addCommune!: FormGroup ;
  public editCommune!: FormGroup ;
  public deleteCommune!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private communesService: CommunesService, private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadCommunes();
    }

    this.addCommune = this.formBuilder.group({
      libelle_commune: ["", [Validators.required]],
   });
    this.editCommune = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_commune: ["", [Validators.required]],
   });
    this.deleteCommune = this.formBuilder.group({
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

  onClickSubmitAddCommune() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de commune déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addCommune.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addCommune.invalid) {
      this.markFormGroupTouched(this.addCommune); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.communesService.saveCommune(this.addCommune.value).subscribe({
      next: (data: any) => {
        this.loadCommunes();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_commune');
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
        console.error('Erreur lors de l\'ajout de la commune :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditCommune(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de commune déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editCommune.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editCommune.invalid) {
      this.markFormGroupTouched(this.editCommune);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editCommune.value.id;
    this.communesService.editCommune(this.editCommune.value).subscribe({
      next: (data: any) => {
        this.loadCommunes();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_commune');
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
        console.error('Erreur lors de la modification de la commune :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteCommune(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de commune déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteCommune.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteCommune.invalid) {
      this.markFormGroupTouched(this.deleteCommune);
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.communesService.deleteCommune(this.deleteCommune.value).subscribe({
      next: (data: any) => {
        this.loadCommunes();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_commune');
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
        console.error('Erreur lors de la suppression de la commune :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur s\'est produite. Veuillez réessayer.',
          icon: 'error',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#d33'
        });
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

  loadCommunes(): void {
    this.communesService.getAllCommunes().subscribe(
      (data: Commune[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des communes', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(commune =>
      commune.libelle_commune.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editCommune.patchValue({
     id:row.id,
     libelle_commune:row.libelle_commune
    })
  }

  getDeleteForm(row: any){
    this.deleteCommune.patchValue({
     id:row.id,
    })
  }
}