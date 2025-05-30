import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeMouvementService } from '../../../../core/services/types-mouvement/types-mouvement.service';
import { TypeMouvement } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-types-mouvement',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'types-mouvement.component.html'
})
export class TypeMouvementComponent implements OnInit {

  rows: TypeMouvement[] = [];
  temp: TypeMouvement[] = [];
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

  public addTypeMouvement!: FormGroup ;
  public editTypeMouvement!: FormGroup ;
  public deleteTypeMouvement!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeMouvementService: TypeMouvementService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeMouvements();
    this.addTypeMouvement = this.formBuilder.group({
      libelle_type_mouvement: ["", [Validators.required]],
   });
    this.editTypeMouvement = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_type_mouvement: ["", [Validators.required]],
   });
    this.deleteTypeMouvement = this.formBuilder.group({
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

  onClickSubmitAddTypeMouvement() {
    console.log(this.addTypeMouvement.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de type de mouvement déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addTypeMouvement.invalid) {
      this.markFormGroupTouched(this.addTypeMouvement);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.typeMouvementService.saveTypeMouvement(this.addTypeMouvement.value).subscribe({
      next: (data: any) => {
        this.loadTypeMouvements();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeMouvement');
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
        console.error('Erreur lors de l\'ajout du TypeMouvement :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

onClickSubmitEditTypeMouvement(){
  console.log(this.editTypeMouvement.value);
  // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de type de mouvement déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
  if (this.editTypeMouvement.invalid) {
    this.markFormGroupTouched(this.editTypeMouvement);
    // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
    alert("Désolé, le formulaire n'est pas bien renseigné");
    return;
  }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editTypeMouvement.value.id;
    this.typeMouvementService.editTypeMouvement(this.editTypeMouvement.value).subscribe({
      next: (data: any) => {
        this.loadTypeMouvements();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeMouvement');
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
        console.error('Erreur lors de la modification du TypeMouvement :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

onClickSubmitDeleteTypeMouvement(){
  console.log(this.deleteTypeMouvement.value);
  // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de type de mouvement déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
  if (this.deleteTypeMouvement.invalid) {
    alert("Désolé, le formulaire n'est pas bien renseigné");
    return;
  }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.typeMouvementService.deleteTypeMouvement(this.deleteTypeMouvement.value).subscribe({
      next: (data: any) => {
        this.loadTypeMouvements();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeMouvement');
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
        console.error('Erreur lors de la supression du TypeMouvement  :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }



  loadTypeMouvements(): void {
    this.typeMouvementService.getAllTypeMouvement().subscribe(
      (data: TypeMouvement[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Type Mouvements', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeMouvement =>
      typeMouvement.libelle_type_mouvement.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeMouvement.patchValue({
     id:row.id,
     libelle_type_mouvement:row.libelle_type_mouvement,
     valeur:row.valeur
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeMouvement.patchValue({
     id:row.id,
    })
  }
}