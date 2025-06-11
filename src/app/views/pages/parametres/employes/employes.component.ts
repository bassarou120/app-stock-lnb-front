import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { EmployesService } from '../../../../core/services/employes/employes.service';
import { Employe } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'employes.component.html'
})
export class EmployesComponent implements OnInit {

  rows: Employe[] = [];
  temp: Employe[] = [];
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

  public addEmploye!: FormGroup ;
  public editEmploye!: FormGroup ;
  public deleteEmploye!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private employeService: EmployesService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadEmployes();
    this.addEmploye = this.formBuilder.group({
      nom: ["", [Validators.required]],
      prenom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      email: ["", []],
   });
    this.editEmploye  = this.formBuilder.group({
      id: [0, [Validators.required]],
      nom: ["", [Validators.required]],
      prenom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      email: ["", []],
   });
    this.deleteEmploye  = this.formBuilder.group({
      id: [0, [Validators.required]],
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

  onClickSubmitAddEmploye () {
  console.log(this.addEmploye.value);
  // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

  // 1. Vérifier si une soumission est déjà en cours
  if (this.isAdding) {
    console.warn('Ajout d\'employé déjà en cours. Opération annulée.');
    return;
  }

  // 2. Valider le formulaire
  if (this.addEmploye.invalid) {
    this.markFormGroupTouched(this.addEmploye); // Marque tous les champs comme touchés pour afficher les erreurs
    // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
    alert("Désolé, le formulaire n'est pas bien renseigné");
    return;
  }

  // 3. Activer l'indicateur de chargement
  this.isAdding = true;
  // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

  this.employeService.saveEmploye(this.addEmploye.value).subscribe({
    next: (data: any) => {
      this.loadEmployes();
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      this.addEmploye.reset();

      // Fermer le modal manuellement
      const modal = document.getElementById('add_employe');
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
      console.error('Erreur lors de l\'ajout de l\'employe :', error);
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      alert('Une erreur s\'est produite. Veuillez réessayer.');
    },
    complete: () => {
      // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
      this.isAdding = false;
    }
  });
}

onClickSubmitEditEmploye (){
  console.log(this.editEmploye.value);
  // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

  // 1. Vérifier si une soumission est déjà en cours
  if (this.isEditing) {
    console.warn('Modification d\'employé déjà en cours. Opération annulée.');
    return;
  }

  // 2. Valider le formulaire
  if (this.editEmploye.invalid) {
    this.markFormGroupTouched(this.editEmploye);
    // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
    alert("Désolé, le formulaire n'est pas bien renseigné");
    return;
  }

  // 3. Activer l'indicateur de chargement
  this.isEditing = true;
  // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

  const id = this.editEmploye.value.id;
  this.employeService.editEmploye(this.editEmploye.value).subscribe({
    next: (data: any) => {
      this.loadEmployes();
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      this.editEmploye.reset();

      // Fermer le modal manuellement
      const modal = document.getElementById('edit_employe');
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
      console.error('Erreur lors de la modification de l\'employe :', error);
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      alert('Une erreur s\'est produite. Veuillez réessayer.');
    },
    complete: () => {
      // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
      this.isEditing = false;
    }
  });
}

onClickSubmitDeleteEmploye (){
  console.log(this.deleteEmploye.value);
  // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

  // 1. Vérifier si une soumission est déjà en cours
  if (this.isDeleting) {
    console.warn('Suppression d\'employé déjà en cours. Opération annulée.');
    return;
  }

  // 2. Valider le formulaire
  if (this.deleteEmploye.invalid) {
    this.markFormGroupTouched(this.deleteEmploye);
    alert("Désolé, le formulaire n'est pas bien renseigné");
    return;
  }

  // 3. Activer l'indicateur de chargement
  this.isDeleting = true;
  // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

  this.employeService.deleteEmploye(this.deleteEmploye.value).subscribe({
    next: (data: any) => {
      this.loadEmployes();
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      this.deleteEmploye.reset();

      // Fermer le modal manuellement
      const modal = document.getElementById('delete_employe');
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
      console.error('Erreur lors de la supression de Employe  :', error);
      // if (spinner) spinner.classList.add('d-none'); // Géré par complete
      alert('Une erreur s\'est produite. Veuillez réessayer.');
    },
    complete: () => {
      // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
      this.isDeleting = false;
    }
  });
}


loadEmployes(): void {
    this.employeService.getAllEmployes().subscribe(
      (data: Employe[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Employes', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(employe =>
      employe.nom.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editEmploye.patchValue({
     id:row.id,
     nom:row.nom,
     prenom:row.prenom,
     telephone:row.telephone,
     email:row.email

    })
  }

  getDeleteForm(row: any){
    this.deleteEmploye.patchValue({
     id:row.id,
    })
  }

  downloadEmployes() {
    this.employeService.imprimerEmployes().subscribe((response: Blob) => {
      const fileURL = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = fileURL;
      a.download = 'liste_personnels.pdf'; // Nom du fichier à télécharger
      a.click();
    }, error => {
      console.error('Erreur lors du téléchargement du PDF', error);
    });
  }
}