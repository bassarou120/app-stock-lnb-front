import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { RoleService } from '../../../../core/services/roles/roles.service';
import { Role } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

declare var bootstrap: any; // Pour interagir avec les modales Bootstrap via JS

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    HttpClientModule, // Importez HttpClientModule ici (si ce n'est pas déjà fait au niveau global)
  ],
  templateUrl: './roles.component.html'
})
export class RoleComponent implements OnInit {

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddRole: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canAddParametrage: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Role[] = [];
  temp: Role[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addRoleForm!: FormGroup;
  public editRoleForm!: FormGroup;
  public deleteRoleForm!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private roleService: RoleService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
    this.initForms();
    this.loadRoles();
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
      this.canAddRole = allowedFonctionnalites.includes('Ajout role');
      this.canAddParametrage = allowedFonctionnalites.includes('Ajout Parametrage');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canAddRole || this.canAddParametrage;

      console.log('🔐 Permissions calculées:', {
        canAddRole: this.canAddRole,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la gestion des roles');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  initForms(): void {
    this.addRoleForm = this.formBuilder.group({
      libelle_role: ["", [Validators.required]]
    });

    this.editRoleForm = this.formBuilder.group({
      id: ["", [Validators.required]],
      libelle_role: ["", [Validators.required]]
    });

    this.deleteRoleForm = this.formBuilder.group({
      id: ["", [Validators.required]],
    });
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

  // --- Chargement des rôles ---
  loadRoles(): void {
    this.loadingIndicator = true;
    this.roleService.getAllRoles().subscribe({
      next: (data: Role[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
        console.log("Liste des rôles :", this.rows);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rôles :', err);
        this.loadingIndicator = false;
        alert('Impossible de charger les rôles. Veuillez réessayer plus tard.');
      }
    });
  }

  // --- Ajout de rôle ---
  onClickSubmitAddRole(): void {

    if (!this.canAddRole) {
      alert('Vous n\'avez pas l\'autorisation d\'ajouter de role.');
      return;
    }

    console.log("Données du formulaire d'ajout rôle (avant envoi) :", this.addRoleForm.value);

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de rôle déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addRoleForm.invalid) {
      this.markFormGroupTouched(this.addRoleForm);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;

    this.roleService.saveRole(this.addRoleForm.value).subscribe({
      next: (newRole: Role) => {
        this.loadRoles();
        this.addRoleForm.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Afficher l'alerte de succès après la fermeture du modal
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert ajout visible après fermeture du modal:', this.alertAjoutVisible);
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout du rôle :', error);
        let errorMessage = 'Une erreur s\'est produite lors de l\'ajout.';
        if (error.status === 422 && error.error && error.error.libelle_role) {
          errorMessage = `Erreur de validation : ${error.error.libelle_role[0]}`;
        }
        alert(errorMessage);
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  // --- Modification de rôle ---
  onClickSubmitEditRole(): void {

    console.log("Données du formulaire de modification rôle (avant envoi) :", this.editRoleForm.value);

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de rôle déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editRoleForm.invalid) {
      this.markFormGroupTouched(this.editRoleForm);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;

    const id = this.editRoleForm.value.id;
    const dataToUpdate = { libelle_role: this.editRoleForm.value.libelle_role };

    this.roleService.updateRole(id, dataToUpdate).subscribe({
      next: (updatedRole: Role) => {
        this.loadRoles();
        this.editRoleForm.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Afficher l'alerte de succès après la fermeture du modal
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert modification visible après fermeture du modal:', this.alertModifVisible);
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du rôle :', error);
        let errorMessage = 'Une erreur s\'est produite lors de la modification.';
        if (error.status === 422 && error.error && error.error.libelle_role) {
          errorMessage = `Erreur de validation : ${error.error.libelle_role[0]}`;
        }
        alert(errorMessage);
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  // --- Suppression de rôle ---
  onClickSubmitDeleteRole(): void {
    console.log("ID rôle pour suppression (avant envoi) :", this.deleteRoleForm.value);

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de rôle déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteRoleForm.invalid) {
      alert("Erreur: ID du rôle à supprimer non trouvé.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;

    const idToDelete = this.deleteRoleForm.value.id;

    this.roleService.deleteRole(idToDelete).subscribe({
      next: () => {
        this.loadRoles();
        this.deleteRoleForm.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Afficher l'alerte de succès après la fermeture du modal
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert suppression visible après fermeture du modal:', this.alertSuppVisible);
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du rôle :', error);
        alert('Une erreur s\'est produite lors de la suppression. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

  // --- Filtrage du tableau ---
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    this.rows = this.temp.filter(role =>
      (role.libelle_role && role.libelle_role.toLowerCase().includes(val)) || !val
    );
    this.table.offset = 0;
  }

  // --- Pré-remplir les formulaires (sans ouvrir les modales ici) ---
  getEditForm(row: Role): void {
    this.editRoleForm.patchValue({
      id: row.id,
      libelle_role: row.libelle_role
    });
    // La modale est ouverte par data-bs-toggle dans le HTML
  }

  getDeleteForm(row: Role): void {
    this.deleteRoleForm.patchValue({
      id: row.id,
    });
    // La modale est ouverte par data-bs-toggle dans le HTML
  }
}