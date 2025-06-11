import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { PermissionService } from '../../../../core/services/permissions/permissions.service';
import { Permission } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDropdownModule, NgbNavModule  } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';

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
    NgbNavModule
  ],
  templateUrl: './permissions.component.html'
})
export class PermissionComponent implements OnInit {

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
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.permissionService.getPermissions().subscribe((permissions: Permission[]) => {
      this.permissions = permissions;
      this.groupPermissionsByRoleAndModule();
      console.log(this.permissions);
    });
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
  const payload = {
    role_id: permission.role_id,
    module_id: permission.module_id,
    fonctionnalite_id: permission.fonctionnalite_id,
    is_active: !permission.is_active, // Inverser l’état
  };

  // Appeler le service pour mettre à jour la permission
  this.permissionService.updatePermission(payload).subscribe({
    next: () => {
      // Mettre à jour l'état local
      // permission.is_active = payload.is_active;
      this.permissionService.getPermissions()
    },
    error: (err) => {
      console.error('Erreur lors de la mise à jour :', err);
      // Si erreur, tu peux afficher un message ou rétablir l'état précédent
    },
  });
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
