import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { PermissionService } from '../../../../core/services/permissions/permissions.service';
import { Permission } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
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

  allowedFonctionnalites: string[] = [];
  canVoirPermission: boolean = true;
  hasPageAccess: boolean = true;

  permissions: Permission[] = [];

  groupedPermissions: Record<string, Record<string, Permission[]>> = {};

  pendingChanges: Map<string, boolean> = new Map();
  hasUnsavedChanges: boolean = false;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addRoleForm!: FormGroup;
  public editRoleForm!: FormGroup;
  public deleteRoleForm!: FormGroup;

  activeNavId = 1;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private permissionService: PermissionService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializePermissions();
    this.initForms();
    this.loadPermissions();
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

      this.canVoirPermission = allowedFonctionnalites.includes('Voir permissions');
      this.hasPageAccess = this.canVoirPermission;

      console.log('🔐 Permissions calculées:', {
        canVoirPermission: this.canVoirPermission,
        hasPageAccess: this.hasPageAccess
      });

      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé aux page de permissions');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
    }
  }

  // 🔥 NOUVELLE MÉTHODE : Charger les permissions avec diagnostic
  private loadPermissions(): void {
  console.log('🔄 Chargement des permissions...');
  
  this.permissionService.getPermissions().subscribe({
    next: (permissions: Permission[]) => {
      console.log('✅ Permissions reçues dans le composant:', permissions);
      console.log('📊 Nombre de permissions:', permissions?.length);
      
      if (!permissions || permissions.length === 0) {
        console.error('❌ ERREUR : Aucune permission reçue !');
        Swal.fire({
          icon: 'warning',
          title: 'Aucune donnée',
          text: 'Aucune permission n\'a pu être chargée.',
          confirmButtonColor: '#009b3a'
        });
        return;
      }

      // 🔥 Vérifier la structure
      console.log('🔍 Exemple de permission:', permissions[0]);
      
      this.permissions = permissions;
      this.groupPermissionsByRoleAndModule();
      
      console.log('📊 Groupes de permissions:', this.groupedPermissions);
      console.log('📈 Nombre de rôles:', Object.keys(this.groupedPermissions).length);
    },
    error: (err) => {
      console.error('❌ Erreur lors du chargement des permissions:', err);
      console.error('❌ Détails de l\'erreur:', JSON.stringify(err, null, 2));
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les permissions. Veuillez réessayer.',
        confirmButtonColor: '#009b3a'
      });
    }
  });
}

  // 🔥 NOUVELLE MÉTHODE : Diagnostic des permissions
  private diagnosePermissions(permissions: Permission[]): void {
    console.group('🔍 DIAGNOSTIC DES PERMISSIONS');

    // Grouper par rôle
    const roleGroups = permissions.reduce((acc, p) => {
      const roleName = p.role?.libelle_role || 'UNDEFINED';
      if (!acc[roleName]) acc[roleName] = [];
      acc[roleName].push(p);
      return acc;
    }, {} as Record<string, Permission[]>);

    console.log('📊 Répartition par rôle:');
    Object.entries(roleGroups).forEach(([role, perms]) => {
      console.log(`  - ${role}: ${perms.length} permissions`);

      // Grouper par module pour ce rôle
      const moduleGroups = perms.reduce((acc, p) => {
        const moduleName = p.module?.libelle_module || 'UNDEFINED';
        if (!acc[moduleName]) acc[moduleName] = 0;
        acc[moduleName]++;
        return acc;
      }, {} as Record<string, number>);

      console.log(`    Modules:`, moduleGroups);
    });

    // Vérifier les données manquantes
    const missingData = permissions.filter(p =>
      !p.role || !p.module || !p.fonctionnalite
    );

    if (missingData.length > 0) {
      console.warn('⚠️ Permissions avec données manquantes:', missingData.length);
      console.table(missingData.map(p => ({
        id: p.id,
        role_id: p.role_id,
        module_id: p.module_id,
        fonctionnalite_id: p.fonctionnalite_id,
        hasRole: !!p.role,
        hasModule: !!p.module,
        hasFonctionnalite: !!p.fonctionnalite
      })));
    }

    console.groupEnd();
  }

  groupPermissionsByRoleAndModule(): void {
    this.groupedPermissions = {};

    if (!this.permissions || this.permissions.length === 0) {
      console.warn('⚠️ Aucune permission à grouper');
      return;
    }

    // 🔥 Filtrer les permissions invalides
    const validPermissions = this.permissions.filter(p => {
      const isValid = p && p.role && p.fonctionnalite && p.fonctionnalite.libelle_fonctionnalite;
      if (!isValid) {
        console.warn('⚠️ Permission invalide détectée:', p);
      }
      return isValid;
    });

    console.log(`✅ Permissions valides: ${validPermissions.length}/${this.permissions.length}`);

    // 🔥 Grouper par rôle et par le module de la fonctionnalité
    validPermissions.forEach(permission => {
      const role = permission.role.libelle_role;
      const module = permission.module.libelle_module; // 🔥 Module de la fonctionnalité

      if (!this.groupedPermissions[role]) {
        this.groupedPermissions[role] = {};
      }

      if (!this.groupedPermissions[role][module]) {
        this.groupedPermissions[role][module] = [];
      }

      this.groupedPermissions[role][module].push(permission);
    });

    console.log('📊 Groupement terminé:', {
      roles: Object.keys(this.groupedPermissions).length,
      totalGroups: Object.values(this.groupedPermissions)
        .reduce((sum, roleData) => sum + Object.keys(roleData).length, 0)
    });

    // 🔥 DIAGNOSTIC : Afficher la structure pour chaque rôle
    Object.entries(this.groupedPermissions).forEach(([role, modules]) => {
      console.log(`📋 Rôle: ${role}`);
      Object.entries(modules).forEach(([module, perms]: [string, any]) => {
        console.log(`  📦 Module: ${module} - ${perms.length} permissions`);
        console.log(`      Fonctionnalités:`, perms.map((p: any) => p.fonctionnalite.libelle_fonctionnalite));
      });
    });
  }

  isModuleFullyChecked(permissions: Permission[]): boolean {
    return permissions.every(p => {
      const key = this.getPermissionKey(p);
      return this.pendingChanges.has(key) ? this.pendingChanges.get(key)! : p.is_active;
    });
  }

  onPermissionToggle(permission: Permission, event: Event): void {
    if (!this.canVoirPermission) {
      event.preventDefault();
      Swal.fire({
        icon: 'error',
        title: 'Accès refusé',
        text: 'Vous n\'avez pas l\'autorisation de modifier les permissions.',
        timer: 2000
      });
      return;
    }

    const checkbox = event.target as HTMLInputElement;
    const key = this.getPermissionKey(permission);

    this.pendingChanges.set(key, checkbox.checked);
    this.hasUnsavedChanges = true;

    console.log('📝 Changement enregistré:', {
      permission: permission.fonctionnalite.libelle_fonctionnalite,
      newState: checkbox.checked,
      totalPendingChanges: this.pendingChanges.size
    });
  }

  public getPermissionKey(permission: Permission): string {
    return `${permission.role_id}-${permission.module_id}-${permission.fonctionnalite_id}`;
  }

  getPermissionState(permission: Permission): boolean {
    const key = this.getPermissionKey(permission);
    return this.pendingChanges.has(key) ? this.pendingChanges.get(key)! : permission.is_active;
  }

  saveAllChanges(): void {
    if (!this.hasUnsavedChanges || this.pendingChanges.size === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Aucune modification',
        text: 'Il n\'y a aucune modification à enregistrer.',
        timer: 2000
      });
      return;
    }

    Swal.fire({
      title: 'Confirmer les modifications',
      text: `Vous êtes sur le point d'enregistrer ${this.pendingChanges.size} modification(s). Continuer ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#009b3a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, enregistrer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processPendingChanges();
      }
    });
  }

  private processPendingChanges(): void {
    const updates: any[] = [];

    this.pendingChanges.forEach((newState, key) => {
      const [roleId, moduleId, fonctionnaliteId] = key.split('-').map(Number);
      updates.push({
        role_id: roleId,
        module_id: moduleId,
        fonctionnalite_id: fonctionnaliteId,
        is_active: newState
      });
    });

    Swal.fire({
      title: 'Enregistrement en cours...',
      text: `Sauvegarde de ${updates.length} modification(s)`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let completedUpdates = 0;
    let hasError = false;

    updates.forEach(payload => {
      this.permissionService.updatePermission(payload).subscribe({
        next: () => {
          completedUpdates++;

          if (completedUpdates === updates.length && !hasError) {
            this.onSaveSuccess();
          }
        },
        error: (err) => {
          hasError = true;
          console.error('Erreur lors de la mise à jour :', err);
          this.onSaveError();
        }
      });
    });
  }

  private onSaveSuccess(): void {
    Swal.fire({
      icon: 'success',
      title: 'Modifications enregistrées',
      text: 'Toutes les permissions ont été mises à jour avec succès !',
      timer: 2000,
      showConfirmButton: false
    });

    this.pendingChanges.clear();
    this.hasUnsavedChanges = false;

    // 🔥 Recharger avec la nouvelle méthode
    this.loadPermissions();

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.role_id) {
      this.updateCurrentUserPermissions();
    }
  }

  private onSaveError(): void {
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
      confirmButtonColor: '#009b3a'
    });
  }

  cancelChanges(): void {
    if (!this.hasUnsavedChanges) {
      return;
    }

    Swal.fire({
      title: 'Annuler les modifications ?',
      text: `Vous allez perdre ${this.pendingChanges.size} modification(s) non enregistrée(s).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, garder'
    }).then((result) => {
      if (result.isConfirmed) {
        this.pendingChanges.clear();
        this.hasUnsavedChanges = false;

        Swal.fire({
          icon: 'info',
          title: 'Modifications annulées',
          text: 'Toutes les modifications ont été annulées.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  private updateCurrentUserPermissions(): void {
    this.permissionService.getCurrentUserPermissions().subscribe((userPermissions: any[]) => {
      const activePermissions = userPermissions.filter(p => p.is_active === true);

      const allowedModules: string[] = [];
      const allowedFonctionnalites: string[] = [];

      activePermissions.forEach(perm => {
        if (perm.module && perm.module.libelle_module) {
          const moduleName = perm.module.libelle_module;
          if (!allowedModules.includes(moduleName)) {
            allowedModules.push(moduleName);
          }
        }

        if (perm.fonctionnalite && perm.fonctionnalite.libelle_fonctionnalite) {
          const fonctionnaliteName = perm.fonctionnalite.libelle_fonctionnalite;
          if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
            allowedFonctionnalites.push(fonctionnaliteName);
          }
        }
      });

      console.log('🔄 PERMISSIONS - Fonctionnalités mises à jour:', allowedFonctionnalites);

      localStorage.setItem('permissions', JSON.stringify(activePermissions));
      localStorage.setItem('allowedModules', JSON.stringify(allowedModules));
      localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites));

      window.dispatchEvent(new CustomEvent('permissionsUpdated', {
        detail: {
          permissions: activePermissions,
          allowedModules: allowedModules,
          allowedFonctionnalites: allowedFonctionnalites
        }
      }));
    });
  }

  private getCurrentUserRoleId(): number {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role_id;
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
