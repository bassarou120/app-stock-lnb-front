import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { RoleService } from '../../../../core/services/roles/roles.service';
import { Role } from '../../../../core/services/interface/models';
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

  rows: Role[] = [];
  temp: Role[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addRoleForm!: FormGroup;
  public editRoleForm!: FormGroup;
  public deleteRoleForm!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(
    private roleService: RoleService,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadRoles();
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
    console.log("Données du formulaire d'ajout rôle (avant envoi) :", this.addRoleForm.value);
    const spinner = document.querySelector('.spinner-add-role');

    if (this.addRoleForm.valid) {
      if (spinner) spinner.classList.remove('d-none');

      this.roleService.saveRole(this.addRoleForm.value).subscribe({
        next: (newRole: Role) => {
          this.loadRoles();
          if (spinner) spinner.classList.add('d-none');
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
          if (spinner) spinner.classList.add('d-none');
          let errorMessage = 'Une erreur s\'est produite lors de l\'ajout.';
          if (error.status === 422 && error.error && error.error.libelle_role) {
            errorMessage = `Erreur de validation : ${error.error.libelle_role[0]}`;
          }
          alert(errorMessage);
        }
      });
    } else {
      this.addRoleForm.markAllAsTouched();
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné.");
    }
  }

  // --- Modification de rôle ---
  onClickSubmitEditRole(): void {
    console.log("Données du formulaire de modification rôle (avant envoi) :", this.editRoleForm.value);
    const spinner = document.querySelector('.spinner-edit-role');

    if (this.editRoleForm.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editRoleForm.value.id;
      const dataToUpdate = { libelle_role: this.editRoleForm.value.libelle_role };

      this.roleService.updateRole(id, dataToUpdate).subscribe({
        next: (updatedRole: Role) => {
          this.loadRoles();
          if (spinner) spinner.classList.add('d-none');
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
          if (spinner) spinner.classList.add('d-none');
          let errorMessage = 'Une erreur s\'est produite lors de la modification.';
          if (error.status === 422 && error.error && error.error.libelle_role) {
            errorMessage = `Erreur de validation : ${error.error.libelle_role[0]}`;
          }
          alert(errorMessage);
        }
      });
    } else {
      this.editRoleForm.markAllAsTouched();
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné.");
    }
  }

  // --- Suppression de rôle ---
  onClickSubmitDeleteRole(): void {
    console.log("ID rôle pour suppression (avant envoi) :", this.deleteRoleForm.value);
    const spinner = document.querySelector('.spinner-delete-role');

    if (this.deleteRoleForm.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const idToDelete = this.deleteRoleForm.value.id;

      this.roleService.deleteRole(idToDelete).subscribe({
        next: () => {
          this.loadRoles();
          if (spinner) spinner.classList.add('d-none');
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
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite lors de la suppression. Veuillez réessayer.');
        }
      });
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Erreur: ID du rôle à supprimer non trouvé.");
    }
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
