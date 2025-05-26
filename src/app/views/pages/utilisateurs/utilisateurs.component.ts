// src/app/modules/parametrage/utilisateur/utilisateur.component.ts

import { Component, ViewChild, OnInit, inject, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { UtilisateurService } from '../../../core/services/utilisateurs/utilisateurs.service';
import { User, Role, Employe, Utilisateur } from '../../../core/services/interface/models'; // Ensure Employe is imported here
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

declare var bootstrap: any;

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    NgbDatepickerModule,
    NgSelectModule,
  ],
  templateUrl: './utilisateurs.component.html',
  styleUrls: ['./utilisateurs.component.scss']
})
export class UtilisateurComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: User[] = [];
  temp: User[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  roles: Role[] = [];
  employes: Employe[] = []; // Liste des Employés
  selectedEmploye: Employe | null = null; // Pour stocker l'employé actuellement sélectionné dans le ng-select
  selectedUserForView: Utilisateur | null = null;

  sexeOptions = [
    { label: 'Masculin', value: 'Masculin' },
    { label: 'Féminin', value: 'Féminin' }
  ];

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addUserForm!: FormGroup;
  public editUserForm!: FormGroup;
  public deleteUserForm!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;
  // Pour la modale de modification (utilisée par NgbModal.open())
  @ViewChild('editUserContent') editUserContent!: TemplateRef<any>; // <-- AJOUTE CETTE LIGNE
  @ViewChild('deleteUserContent') deleteUserContent!: TemplateRef<any>;

  loading: boolean = false;

  constructor(
    private utilisateurService: UtilisateurService,
    private formBuilder: FormBuilder,
    public modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadEmployes(); // Charger la liste des employés
    this.initForms();
  }

  // --- Initialisation des Formulaires ---
  initForms(): void {
    this.addUserForm = this.formBuilder.group({
      employe_id: [null, [Validators.required]], // Champ pour l'ID de l'employé sélectionné
      nom: [{ value: '', disabled: false }, [Validators.required]], // Corrected: Use 'nom' from Employe
      surname: [{ value: '', disabled: false }], // Removed Validators.required if surname is not in Employe
      email: [{ value: '', disabled: false }, [Validators.required, Validators.email]],
      telephone: [{ value: '', disabled: false }, [Validators.required]], // Corrected: Use 'telephone' from Employe
      sexe: [null, [Validators.required]], // This must be chosen manually as 'sexe' is not in Employe
      // password: ['', [Validators.required, Validators.minLength(8)]],
      role_id: [null, [Validators.required]],
      active: [true, [Validators.required]],
      photo: [null]
    });

    this.editUserForm = this.formBuilder.group({
      id: ["", [Validators.required]],
      // name: ["", [Validators.required]],
      // surname: ["", [Validators.required]],
      // email: ["", [Validators.required, Validators.email]],
      // phone: ["", [Validators.required]],
      // sexe: [null, [Validators.required]],
      // // password: ["", [Validators.minLength(8)]], // Password optional on edit
      role_id: [null, [Validators.required]],
      active: [null, [Validators.required]],
      // photo: [null]
    });

    this.deleteUserForm = this.formBuilder.group({
      id: ["", [Validators.required]], // <-- Vide string est bon pour un UUID
    });
  }

  // --- Logique de Sélection d'Employé ---
  onEmployeSelected(event: any): void { // Change 'employeId: number | null' to 'event: any' for now
    let employeId: number | null = null;
    let selectedEmployeObject: Employe | null = null;

    // Détermine si l'événement est l'objet entier ou juste l'ID
    if (typeof event === 'number') { // Si bindValue="id" est utilisé
      employeId = event;
      selectedEmployeObject = this.employes.find(e => e.id === employeId) || null;
    } else if (event && typeof event === 'object' && event.id) { 
      employeId = event.id;
      selectedEmployeObject = event;  
    }

    console.log("Employé sélectionné ID (déduit):", employeId);
    console.log("Objet employé trouvé/sélectionné:", selectedEmployeObject); // C'est ça qui doit être non-null

    if (selectedEmployeObject) {
      this.selectedEmploye = selectedEmployeObject; // Assigne l'objet trouvé ou directement l'événement
      this.addUserForm.patchValue({
        nom: this.selectedEmploye.nom,
        // surname: this.selectedEmploye.prenom, // ATTENTION: Ton interface Employe n'a pas 'prenom'.
                                             // Si tu as 'prenom' dans tes données réelles,
                                             // tu dois l'ajouter à ton interface Employe.
                                             // Pour l'instant, je le commente si ton interface ne l'a pas.
        email: this.selectedEmploye.email,
        telephone: this.selectedEmploye.telephone,
        sexe: null // Sexe n'est pas dans Employe, il reste manuel
      });
      console.log("Formulaire mis à jour avec:", this.addUserForm.value);
    } else {
      this.selectedEmploye = null;
      this.addUserForm.patchValue({
        nom: "",
        surname: "", // Reste vide si pas de source
        email: "",
        telephone: "",
        sexe: null
      });
      console.log("Formulaire réinitialisé.");
    }
  }

  // --- Opérations CRUD Utilisateur ---
  onClickSubmitAddUser(): void {
    // getRawValue() est crucial pour récupérer les valeurs des champs désactivés
    const formData = this.addUserForm.getRawValue();
    console.log("Données du formulaire d'ajout utilisateur (avant envoi) :", formData);

    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    this.loading = true;

    // Envoi des données nécessaires au backend.
    // Le backend récupérera les détails complets de l'employé via l'employe_id.
    const dataToSend = {
      employe_id: formData.employe_id,
      sexe: formData.sexe,
      // password: formData.password,
      role_id: formData.role_id,
      active: formData.active,
      photo: formData.photo 
    };

    this.utilisateurService.saveUser(dataToSend).subscribe({
      next: (data: any) => {
        this.loadUsers(); // Recharge la liste des utilisateurs après l'ajout
        this.loading = false;
        // Réinitialisation du formulaire, y compris les champs désactivés
        this.addUserForm.reset({ active: true, employe_id: null, sexe: null, role_id: null });
        this.selectedEmploye = null; // Réinitialise l'employé sélectionné
        const modalElement = document.getElementById('add_user');
        if (modalElement) {
          const bsModal = bootstrap.Modal.getInstance(modalElement);
          bsModal?.hide();
        }
        // this.showAlert('ajout');
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout de l\'utilisateur :', error);
        this.loading = false;

        if (error.status === 422 && error.error && error.error.errors) {
          let errorMessage = 'Erreur de validation :<br>';
          for (const key in error.error.errors) {
            if (Object.prototype.hasOwnProperty.call(error.error.errors, key)) {
              errorMessage += `- ${error.error.errors[key][0]}<br>`;
            }
          }
          alert(errorMessage);
        } else {
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      }
    });
  }

  onClickSubmitEditUser(): void {
    console.log("Formulaire modification envoyé:", this.editUserForm.value);
    const spinner = document.querySelector('.spinnerEdit'); // Assure-toi d'avoir un spinner pour la modification

    if (this.editUserForm.invalid) {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire de modification n'est pas bien renseigné.");
      return;
    }

    if (spinner) spinner.classList.remove('d-none');

    const userId: string = this.editUserForm.value.id;
    // On n'envoie que les champs que l'on veut modifier
    const userDataToUpdate = {
      role_id: this.editUserForm.value.role_id,
      active: this.editUserForm.value.active
    };

    this.utilisateurService.updateUser(userId, userDataToUpdate).subscribe({
      next: (data: User) => {
        this.loadUsers(); // Recharge la liste des utilisateurs pour voir les changements
        if (spinner) spinner.classList.add('d-none');
        this.editUserForm.reset(); // Réinitialise le formulaire de modification
        this.modalService.dismissAll(); // Ferme la modale de modification

        // Afficher l'alerte de succès
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert modification visible après fermeture du modal:', this.alertModifVisible);
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification de l\'utilisateur :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite lors de la modification. Veuillez réessayer.');
      }
    });
  }


  onClickSubmitDeleteUser(): void {
    console.log("Formulaire suppression envoyé:", this.deleteUserForm.value);
    const spinner = document.querySelector('.spinnerDelete'); // Assure-toi que ce spinner est lié au bouton de suppression

    if (this.deleteUserForm.invalid) {
      alert("Erreur: ID de l'utilisateur à supprimer non trouvé.");
      return;
    }

    if (spinner) spinner.classList.remove('d-none');

    const userId: string = this.deleteUserForm.value.id;

    this.utilisateurService.deleteUser(userId).subscribe({
      next: (data: any) => {
        this.loadUsers(); // Recharge la liste des utilisateurs
        if (spinner) spinner.classList.add('d-none');
        this.deleteUserForm.reset();

        // Ferme la modale via NgbModal
        this.modalService.dismissAll(); // Ferme toutes les modales ouvertes, ou this.modalService.dismiss('reason'); pour une modale spécifique

        // Gestion de l'alerte de succès
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000);
        }, 200);
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite lors de la suppression. Veuillez réessayer.');
      }
    });
  }

  // Nouvelle méthode pour voir le profil de l'utilisateur
  onViewUserProfile(user: Utilisateur): void {
    this.loading = true; // Active un indicateur de chargement si tu en as un
    this.utilisateurService.getUserById(user.id).subscribe({
      next: (userProfile) => {
        this.selectedUserForView = userProfile;
        this.loading = false; // Désactive l'indicateur
      },
      error: (err) => {
        console.error("Erreur lors du chargement du profil utilisateur :", err);
        alert("Impossible de charger le profil utilisateur. Vérifiez la console.");
        this.loading = false; // Désactive l'indicateur même en cas d'erreur
      }
    });
  }

  // --- Méthodes de Chargement des Données ---
  loadRoles(): void {
    this.utilisateurService.getAllRoles().subscribe({
      next: (response: any) => {
        this.roles = response.data;
        console.log("Liste des rôles :", this.roles);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des rôles :", err);
      }
    });
  }

  loadEmployes(): void {
    this.utilisateurService.getAllEmployes().subscribe({
      next: (data: Employe[]) => {
        this.employes = data; // Stocker la liste des Employés
        console.log("Liste des employés :", this.employes);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }

  loadUsers(): void {
    this.loadingIndicator = true;
    this.utilisateurService.getAllUsers().subscribe({
      next: (data: User[]) => {
        console.log("Utilisateurs reçus directement du service :", data);
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error: error => {
        console.error('Erreur lors du chargement des utilisateurs', error);
        this.loadingIndicator = false;
      }
    });
  }

  // --- Filtrage du Tableau & Actions ---
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(user =>
      (user.name && user.name.toLowerCase().includes(val)) ||
      (user.surname && user.surname.toLowerCase().includes(val)) ||
      (user.email && user.email.toLowerCase().includes(val)) ||
      (user.phone && user.phone.toLowerCase().includes(val)) ||
      (user.role?.libelle_role && user.role.libelle_role.toLowerCase().includes(val)) ||
      !val
    );

    this.table.offset = 0;
  }

  getEditForm(row: User) {
    // Remplir le formulaire de modification avec les données de l'utilisateur sélectionné
    this.editUserForm.patchValue({
      id: row.id,
      role_id: row.role_id,
      active: row.active
    });
    console.log("Données utilisateur pour modification:", this.editUserForm.value);

    // Ouvre la modale de modification
    this.modalService.open(this.editUserContent, { centered: true });
  }  

  getDeleteForm(row: User) {
    this.deleteUserForm.patchValue({
      id: row.id,
    });
    console.log("ID utilisateur pour suppression:", this.deleteUserForm.value.id);
    // OUVRIR LA MODALE DE SUPPRESSION ICI
    this.modalService.open(this.deleteUserContent, { centered: true }); // <-- NOUVEAU : Ouvre la modale
  }
  

  // --- Gestion des Alertes ---
  // showAlert(type: 'ajout' | 'modif' | 'supp'): void {
  //   if (type === 'ajout') {
  //     this.alertAjoutVisible = true;
  //   } else if (type === 'modif') {
  //     this.alertModifVisible = true;
  //   } else if (type === 'supp') {
  //     this.alertSuppVisible = true;
  //   }

  //   setTimeout(() => {
  //     this.alertAjoutVisible = false;
  //     this.alertModifVisible = false;
  //     this.alertSuppVisible = false;
  //   }, 2000);
  // }
}