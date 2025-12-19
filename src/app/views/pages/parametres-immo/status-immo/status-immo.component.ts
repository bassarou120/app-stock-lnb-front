import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { StatusImmoService } from '../../../../core/services/status-immo/status-immo.service';
import { StatusImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-status-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'status-immo.component.html'
})
export class StatusImmosComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamImmo: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: StatusImmo[] = [];
  temp: StatusImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addStatusImmo!: FormGroup ;
  public editStatusImmo!: FormGroup ;
  public deleteStatusImmo!: FormGroup ;

  // NOUVELLES PROPRIÉTÉS POUR GÉRER L'ÉTAT DE SOUMISSION DES BOUTONS
  isAddingStatus: boolean = false;
  isEditingStatus: boolean = false;
  isDeletingStatus: boolean = false;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private statusImmoService: StatusImmoService, private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

   
    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadStatusImmos();
    }

    this.addStatusImmo = this.formBuilder.group({
      libelle_status_immo: ["", [Validators.required]],
    });
    this.editStatusImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_status_immo: ["", [Validators.required]],
    });
    this.deleteStatusImmo = this.formBuilder.group({
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
        console.warn('❌ Accès refusé parametrages de parc');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }



  // MÉTHODE UTILITAIRE POUR MARQUER TOUS LES CONTRÔLES DE FORMULAIRE COMME TOUCHÉS
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClickSubmitAddStatusImmo() {
    console.log(this.addStatusImmo.value);
    // const spinner = document.querySelector('.spinner-add');

    // Vérifier si une soumission est déjà en cours
    if (this.isAddingStatus) {
        console.warn('Ajout de statut d\'immobilisation déjà en cours. Opération annulée.');
        return;
    }

    if (this.addStatusImmo.valid) {
      this.isAddingStatus = true; // Désactiver le bouton Ajouter
      // if (spinner) spinner.classList.remove('d-none'); // Géré par [class.d-none]

      this.statusImmoService.saveStatusImmos(this.addStatusImmo.value).subscribe(
        {
            next: (data: any) => {
          this.loadStatusImmos();
          // if (spinner) spinner.classList.add('d-none'); // Géré par complete
          this.addStatusImmo.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_statusImmo');
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
          console.error('Erreur lors de l\'ajout du Status Immo :', error);
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
            this.isAddingStatus = false; // Réactiver le bouton Ajouter une fois l'opération terminée (succès ou erreur)
        }
    }
    );
    } else {
      this.markFormGroupTouched(this.addStatusImmo); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none');
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    }
  }

  onClickSubmitEditStatusImmo(){
    console.log(this.editStatusImmo.value);

    // const spinner = document.querySelector('.spinner-edit');

    // Vérifier si une soumission est déjà en cours
    if (this.isEditingStatus) {
        console.warn('Modification de statut d\'immobilisation déjà en cours. Opération annulée.');
        return;
    }

    if (this.editStatusImmo.valid) {
      this.isEditingStatus = true; // Désactiver le bouton Modifier
      // if (spinner) spinner.classList.remove('d-none');

      const id = this.editStatusImmo.value.id;
      this.statusImmoService.editStatusImmos(this.editStatusImmo.value).subscribe(
        {
            next: (data: any) => {
          this.loadStatusImmos();
          // if (spinner) spinner.classList.add('d-none'); // Géré par complete
          this.editStatusImmo.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_statusImmo');
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
          console.error('Erreur lors de la modification du StatusImmo :', error);
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
            this.isEditingStatus = false; // Réactiver le bouton Modifier une fois l'opération terminée
        }
    }
    );
    } else {
      this.markFormGroupTouched(this.editStatusImmo);
      // if (spinner) spinner.classList.add('d-none'); // Non nécessaire avec les nouvelles propriétés isEditingStatus
      Swal.fire({
  title: 'Erreur',
  text: 'Désolé, le formulaire n\'est pas bien renseigné',
  icon: 'error',
  confirmButtonText: 'Réessayer',
  confirmButtonColor: '#d33'
});
    }
  }

  onClickSubmitDeleteStatusImmo(){
    console.log(this.deleteStatusImmo.value);
    // Le sélecteur de spinner doit être plus spécifique
    // const spinner = document.querySelector('.spinner-delete'); // Non nécessaire avec les nouvelles propriétés isDeletingStatus

    // Vérifier si une soumission est déjà en cours
    if (this.isDeletingStatus) {
        console.warn('Suppression de statut d\'immobilisation déjà en cours. Opération annulée.');
        return;
    }

    if (this.deleteStatusImmo.valid) {
      this.isDeletingStatus = true; // Désactiver le bouton Supprimer
      // if (spinner) spinner.classList.remove('d-none'); // Géré par [class.d-none]

      this.statusImmoService.deleteStatusImmos(this.deleteStatusImmo.value).subscribe(
        {
            next: (data: any) => {
          this.loadStatusImmos();
          // if (spinner) spinner.classList.add('d-none'); // Géré par complete
          this.deleteStatusImmo.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_statusImmo');
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
          console.error('Erreur lors de la supression du statut immobilier :', error);
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
            this.isDeletingStatus = false; // Réactiver le bouton Supprimer une fois l'opération terminée
        }
    }
    );
    } else {
      this.markFormGroupTouched(this.deleteStatusImmo);
      // if (spinner) spinner.classList.add('d-none'); // Non nécessaire avec les nouvelles propriétés isDeletingStatus
      Swal.fire({
  title: 'Erreur',
  text: 'Désolé, le formulaire n\'est pas bien renseigné',
  icon: 'error',
  confirmButtonText: 'Réessayer',
  confirmButtonColor: '#d33'
});
    }
  }

  loadStatusImmos(): void {
    this.statusImmoService.getAllStatusImmos().subscribe(
      (data: StatusImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Status Immo', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(statusImmo =>
      statusImmo.libelle_status_immo.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editStatusImmo.patchValue({
      id:row.id,
      libelle_status_immo:row.libelle_status_immo
    })
  }

  getDeleteForm(row: any){
    this.deleteStatusImmo.patchValue({
      id:row.id,
    })
  }
}
