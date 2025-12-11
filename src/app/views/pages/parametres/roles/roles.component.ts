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
import { PermissionService } from '../../../../core/services/permissions/permissions.service'; // 🔥 AJOUT

declare var bootstrap: any;

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
    HttpClientModule,
  ],
  templateUrl: './roles.component.html'
})
export class RoleComponent implements OnInit {

  allowedFonctionnalites: string[] = [];
  canAddRole: boolean = true;
  canAddParametrage: boolean = true;
  canViewRole: boolean = true;
  hasPageAccess: boolean = true;

  rows: Role[] = [];
  temp: Role[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  isAdding: boolean = false;
  isEditing: boolean = false;
  isDeleting: boolean = false;

  public addRoleForm!: FormGroup;
  public editRoleForm!: FormGroup;
  public deleteRoleForm!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private roleService: RoleService,
    private formBuilder: FormBuilder,
    private router: Router,
    private permissionService: PermissionService // 🔥 AJOUT
  ) { }

  ngOnInit(): void {
    this.initializePermissions();

    if (this.hasPageAccess) {
      this.initForms();
      this.loadRoles();
    }
  }

  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return;
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      this.canAddRole = allowedFonctionnalites.includes('Ajout role');
      this.canAddParametrage = allowedFonctionnalites.includes('Ajout Parametrage');
      this.canViewRole = allowedFonctionnalites.includes('Voir role');

      this.hasPageAccess = this.canViewRole;

      console.log('🔐 Permissions calculées:', {
        canAddRole: this.canAddRole,
        hasPageAccess: this.hasPageAccess
      });

      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la gestion des roles');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
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

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

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

  // 🔥 NOUVELLE MÉTHODE : Mettre à jour le localStorage après modification/suppression de rôle
  private updateLocalStoragePermissions(): void {
    console.log('🔄 Mise à jour du localStorage après modification de rôle...');

    // Récupérer l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!currentUser || !currentUser.role_id) {
      console.warn('⚠️ Utilisateur non trouvé dans le localStorage');
      return;
    }

    // Recharger les permissions de l'utilisateur depuis l'API
    this.permissionService.getCurrentUserPermissions().subscribe({
      next: (userPermissions: any[]) => {
        console.log('📥 Permissions rechargées depuis l\'API:', userPermissions);

        const activePermissions = userPermissions.filter(p => p.is_active === true);

        const allowedModules: string[] = [];
        const allowedFonctionnalites: string[] = [];

        activePermissions.forEach(perm => {
          // Modules
          if (perm.module && perm.module.libelle_module) {
            const moduleName = perm.module.libelle_module;
            if (!allowedModules.includes(moduleName)) {
              allowedModules.push(moduleName);
            }
          }

          // Fonctionnalités
          if (perm.fonctionnalite && perm.fonctionnalite.libelle_fonctionnalite) {
            const fonctionnaliteName = perm.fonctionnalite.libelle_fonctionnalite;
            if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
              allowedFonctionnalites.push(fonctionnaliteName);
            }
          }
        });

        // Mettre à jour le localStorage
        localStorage.setItem('permissions', JSON.stringify(activePermissions));
        localStorage.setItem('allowedModules', JSON.stringify(allowedModules));
        localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites));

        console.log('✅ localStorage mis à jour:', {
          permissions: activePermissions.length,
          modules: allowedModules.length,
          fonctionnalites: allowedFonctionnalites.length
        });

        // 🔥 ÉMETTRE UN ÉVÉNEMENT pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('permissionsUpdated', {
          detail: {
            permissions: activePermissions,
            allowedModules: allowedModules,
            allowedFonctionnalites: allowedFonctionnalites
          }
        }));

        console.log('📢 Événement "permissionsUpdated" émis');
      },
      error: (error) => {
        console.error('❌ Erreur lors de la mise à jour des permissions:', error);
      }
    });
  }

  onClickSubmitAddRole(): void {
    if (!this.canAddRole) {
      alert('Vous n\'avez pas l\'autorisation d\'ajouter de role.');
      return;
    }

    console.log("Données du formulaire d'ajout rôle (avant envoi) :", this.addRoleForm.value);

    if (this.isAdding) {
      console.warn('Ajout de rôle déjà en cours. Opération annulée.');
      return;
    }

    if (this.addRoleForm.invalid) {
      this.markFormGroupTouched(this.addRoleForm);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    this.isAdding = true;

    this.roleService.saveRole(this.addRoleForm.value).subscribe({
      next: (newRole: Role) => {
        this.loadRoles();
        this.addRoleForm.reset();

        // 🔥 MISE À JOUR DU LOCALSTORAGE
        this.updateLocalStoragePermissions();

        const modal = document.getElementById('add_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

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
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditRole(): void {
    console.log("Données du formulaire de modification rôle (avant envoi) :", this.editRoleForm.value);

    if (this.isEditing) {
      console.warn('Modification de rôle déjà en cours. Opération annulée.');
      return;
    }

    if (this.editRoleForm.invalid) {
      this.markFormGroupTouched(this.editRoleForm);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    this.isEditing = true;

    const id = this.editRoleForm.value.id;
    const dataToUpdate = { libelle_role: this.editRoleForm.value.libelle_role };

    this.roleService.updateRole(id, dataToUpdate).subscribe({
      next: (updatedRole: Role) => {
        this.loadRoles();
        this.editRoleForm.reset();

        // 🔥 MISE À JOUR DU LOCALSTORAGE
        this.updateLocalStoragePermissions();

        const modal = document.getElementById('edit_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

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
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteRole(): void {
    console.log("ID rôle pour suppression (avant envoi) :", this.deleteRoleForm.value);

    if (this.isDeleting) {
      console.warn('Suppression de rôle déjà en cours. Opération annulée.');
      return;
    }

    if (this.deleteRoleForm.invalid) {
      alert("Erreur: ID du rôle à supprimer non trouvé.");
      return;
    }

    this.isDeleting = true;

    const idToDelete = this.deleteRoleForm.value.id;

    this.roleService.deleteRole(idToDelete).subscribe({
      next: () => {
        this.loadRoles();
        this.deleteRoleForm.reset();

        // 🔥 MISE À JOUR DU LOCALSTORAGE
        this.updateLocalStoragePermissions();

        const modal = document.getElementById('delete_role');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

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
        this.isDeleting = false;
      }
    });
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    this.rows = this.temp.filter(role =>
      (role.libelle_role && role.libelle_role.toLowerCase().includes(val)) || !val
    );
    this.table.offset = 0;
  }

  getEditForm(row: Role): void {
    this.editRoleForm.patchValue({
      id: row.id,
      libelle_role: row.libelle_role
    });
  }

  getDeleteForm(row: Role): void {
    this.deleteRoleForm.patchValue({
      id: row.id,
    });
  }
}
