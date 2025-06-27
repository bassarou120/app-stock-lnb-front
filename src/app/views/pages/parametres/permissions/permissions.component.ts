import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { PermissionService } from '../../../../core/services/permissions/permissions.service';
import { Permission } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDropdownModule, NgbNavModule  } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


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
    NgbNavModule,
    SweetAlert2Module
  ],
  templateUrl: './permissions.component.html'
})
export class PermissionComponent implements OnInit {

      // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirPermission: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  permissions: Permission[] = [];
  groupedPermissions: Record<string, Record<string, Permission[]>> = {};


  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addRoleForm!: FormGroup;
  public editRoleForm!: FormGroup;
  public deleteRoleForm!: FormGroup;

  activeNavId = 1; // par défaut on ouvre le premier onglet

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private permissionService: PermissionService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    this.initForms();

  this.permissionService.getPermissions().subscribe((permissions: Permission[]) => {
      this.permissions = permissions;
      this.groupPermissionsByRoleAndModule();
      console.log('📋 Permissions chargées pour affichage:', permissions);
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
      this.canVoirPermission = allowedFonctionnalites.includes('Voir permissions');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirPermission;

      console.log('🔐 Permissions calculées:', {
        canVoirPermission: this.canVoirPermission,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé aux page de permissions');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  groupPermissionsByRoleAndModule(): void {
    this.groupedPermissions = {};

    this.permissions.forEach(permission => {
      const role = permission.role.libelle_role;
      const module = permission.module.libelle_module;

      if (!this.groupedPermissions[role]) {
        this.groupedPermissions[role] = {};
      }

      if (!this.groupedPermissions[role][module]) {
        this.groupedPermissions[role][module] = [];
      }

      this.groupedPermissions[role][module].push(permission);
    });
  }

  isModuleFullyChecked(permissions: Permission[]): boolean {
  return permissions.every(p => p.is_active);
}

onPermissionToggle(permission: any): void {

    if (!this.canVoirPermission) {
      alert('Vous n\'avez pas l\'autorisation d\'accorder de permission.');
      return;
    }

    const payload = {
      role_id: permission.role_id,
      module_id: permission.module_id,
      fonctionnalite_id: permission.fonctionnalite_id,
      is_active: !permission.is_active,
    };

    this.permissionService.updatePermission(payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Permission modifiée avec succès',
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true
        });

        // 🔥 ÉTAPE 1 : Recharger l'affichage
        this.permissionService.getPermissions().subscribe((allPermissions: Permission[]) => {
          this.permissions = allPermissions;
          this.groupPermissionsByRoleAndModule();
        });

        // 🔥 ÉTAPE 2 : Mettre à jour localStorage si c'est l'utilisateur connecté
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (permission.role_id === currentUser.role_id) {
          this.updateCurrentUserPermissions();
        }
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour :', err);
      }
    });
  }

   // 🔥 NOUVELLE MÉTHODE : Mettre à jour les permissions de l'utilisateur connecté
 private updateCurrentUserPermissions(): void {
  this.permissionService.getCurrentUserPermissions().subscribe((userPermissions: any[]) => {
    const activePermissions = userPermissions.filter(p => p.is_active === true);

    const allowedModules: string[] = [];
    const allowedFonctionnalites: string[] = []; // 🔥 AJOUT

    activePermissions.forEach(perm => {
      // Modules
      if (perm.module && perm.module.libelle_module) {
        const moduleName = perm.module.libelle_module;
        if (!allowedModules.includes(moduleName)) {
          allowedModules.push(moduleName);
        }
      }

      // 🔥 CORRECTION : Fonctionnalités
      if (perm.fonctionnalite && perm.fonctionnalite.libelle_fonctionnalite) {
        const fonctionnaliteName = perm.fonctionnalite.libelle_fonctionnalite;
        if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
          allowedFonctionnalites.push(fonctionnaliteName);
        }
      }
    });

    console.log('🔄 PERMISSIONS - Fonctionnalités mises à jour:', allowedFonctionnalites); // 🔥 LOG DE DEBUG

    localStorage.setItem('permissions', JSON.stringify(activePermissions));
    localStorage.setItem('allowedModules', JSON.stringify(allowedModules));
    localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites)); // 🔥 AJOUT

    // Notifier la sidebar
    window.dispatchEvent(new CustomEvent('permissionsUpdated', {
      detail: {
        permissions: activePermissions,
        allowedModules: allowedModules,
        allowedFonctionnalites: allowedFonctionnalites // 🔥 AJOUT
      }
    }));
  });
} 


// Exemple d'implémentation (à adapter selon votre logique)
private getCurrentUserRoleId(): number {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role_id; // Retournera 1 (Admin)
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

}
