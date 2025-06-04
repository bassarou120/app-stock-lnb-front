import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { GroupeTypeImmoService } from '../../../../core/services/groupe-type-immo/groupe-type-immo.service';
import { SousTypeImmo, GroupeTypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
declare var bootstrap: any;

@Component({
  selector: 'app-groupe-type-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,

  ],
  templateUrl: 'groupe-type-immo.component.html'
})
export class GroupeTypeImmoComponent implements OnInit {

  rows: GroupeTypeImmo[] = [];
  temp: GroupeTypeImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  sousTypeImmos: SousTypeImmo[] = []; // Liste des types sous type d'immos
  selectedSousTypeImmoId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addGroupeTypeImmo!: FormGroup ;
  public editGroupeTypeImmo!: FormGroup ;
  public deleteGroupeTypeImmo!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private groupeTypeImmoService: GroupeTypeImmoService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadGroupeTypeImmos();
    this.addGroupeTypeImmo = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.editGroupeTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.deleteGroupeTypeImmo = this.formBuilder.group({
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

  onClickSubmitAddGroupeTypeImmo() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de groupe type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addGroupeTypeImmo.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addGroupeTypeImmo.invalid) {
      this.markFormGroupTouched(this.addGroupeTypeImmo); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.groupeTypeImmoService.saveGroupeTypeImmo(this.addGroupeTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadGroupeTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addGroupeTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_groupeTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout du groupe type d\'immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditGroupeTypeImmo(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de groupe type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editGroupeTypeImmo.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editGroupeTypeImmo.invalid) {
      this.markFormGroupTouched(this.editGroupeTypeImmo);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editGroupeTypeImmo.value.id;
    this.groupeTypeImmoService.editGroupeTypeImmo(this.editGroupeTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadGroupeTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editGroupeTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_groupeTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du groupe type d\'Immobilisation :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteGroupeTypeImmo(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de groupe type d\'immobilisation déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteGroupeTypeImmo.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteGroupeTypeImmo.invalid) {
      this.markFormGroupTouched(this.deleteGroupeTypeImmo);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.groupeTypeImmoService.deleteGroupeTypeImmo(this.deleteGroupeTypeImmo.value).subscribe({
      next: (data: any) => {
        this.loadGroupeTypeImmos();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteGroupeTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_groupeTypeImmo');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du groupe Type d\'Immo :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

loadGroupeTypeImmos(): void {
    this.groupeTypeImmoService.getAllGroupeTypeImmos().subscribe(
      (data: GroupeTypeImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Groupe Type d\'Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(groupeTypeImmo =>
      groupeTypeImmo.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editGroupeTypeImmo.patchValue({
     id:row.id,
     id_sous_type_immo:row.id_sous_type_immo,
     libelle:row.libelle,
     compte:row.compte,
    })
  }

  getDeleteForm(row: any){
    this.deleteGroupeTypeImmo.patchValue({
     id:row.id,
    })
  }
}