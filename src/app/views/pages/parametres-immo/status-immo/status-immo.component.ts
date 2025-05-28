import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { StatusImmoService } from '../../../../core/services/status-immo/status-immo.service';
import { StatusImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-status-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'status-immo.component.html'
})
export class StatusImmosComponent implements OnInit {

  rows: StatusImmo[] = [];
  temp: StatusImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addStatusImmo!: FormGroup ;
  public editStatusImmo!: FormGroup ;
  public deleteStatusImmo!: FormGroup ;

  // NOUVELLES PROPRIÉTÉS POUR GÉRER L'ÉTAT DE SOUMISSION DES BOUTONS
  isAddingStatus: boolean = false;
  isEditingStatus: boolean = false;
  isDeletingStatus: boolean = false;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private statusImmoService: StatusImmoService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadStatusImmos();
    this.addStatusImmo = this.formBuilder.group({
      libelle_status_immo: ["", [Validators.required]],
    });
    this.editStatusImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_status_immo: ["", [Validators.required]],
    });
    this.deleteStatusImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  onClickSubmitAddStatusImmo() {
    console.log(this.addStatusImmo.value);
    // Le sélecteur de spinner doit être plus spécifique si vous en avez plusieurs ou utilise les nouvelles propriétés
    const spinner = document.querySelector('.spinner-add'); // Utilisez une classe spécifique pour ce spinner

    if (this.addStatusImmo.valid) {
      this.isAddingStatus = true; // Désactiver le bouton Ajouter
      if (spinner) spinner.classList.remove('d-none'); // Afficher le spinner (si d-none est la classe pour cacher)

      this.statusImmoService.saveStatusImmos(this.addStatusImmo.value).subscribe(
        (data: any) => {
          this.loadStatusImmos();
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.addStatusImmo.reset();
          this.isAddingStatus = false; // Réactiver le bouton Ajouter

          // Fermer le modal manuellement
          const modal = document.getElementById('add_statusImmo');
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
        (error: any) => {
          console.error('Erreur lors de l\'ajout du Status Immo :', error);
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.isAddingStatus = false; // Réactiver le bouton Ajouter en cas d'erreur
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none'); // Cacher le spinner si le formulaire n'est pas valide
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditStatusImmo(){
    console.log(this.editStatusImmo.value);
    // Le sélecteur de spinner doit être plus spécifique
    const spinner = document.querySelector('.spinner-edit'); // Utilisez une classe spécifique pour ce spinner

    if (this.editStatusImmo.valid) {
      this.isEditingStatus = true; // Désactiver le bouton Modifier
      if (spinner) spinner.classList.remove('d-none'); // Afficher le spinner

      const id = this.editStatusImmo.value.id; // Non utilisé ici, mais laissé pour contexte
      this.statusImmoService.editStatusImmos(this.editStatusImmo.value).subscribe(
        (data: any) => {
          this.loadStatusImmos();
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.editStatusImmo.reset();
          this.isEditingStatus = false; // Réactiver le bouton Modifier

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_statusImmo');
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
        (error: any) => {
          console.error('Erreur lors de la modification du StatusImmo :', error);
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.isEditingStatus = false; // Réactiver le bouton Modifier en cas d'erreur
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none'); // Cacher le spinner si le formulaire n'est pas valide
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteStatusImmo(){
    console.log(this.deleteStatusImmo.value);
    // Le sélecteur de spinner doit être plus spécifique
    const spinner = document.querySelector('.spinner-delete'); // Utilisez une classe spécifique pour ce spinner

    if (this.deleteStatusImmo.valid) {
      this.isDeletingStatus = true; // Désactiver le bouton Supprimer
      if (spinner) spinner.classList.remove('d-none'); // Afficher le spinner

      this.statusImmoService.deleteStatusImmos(this.deleteStatusImmo.value).subscribe(
        (data: any) => {
          this.loadStatusImmos();
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.deleteStatusImmo.reset();
          this.isDeletingStatus = false; // Réactiver le bouton Supprimer

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_statusImmo');
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
        (error: any) => {
          console.error('Erreur lors de la supression du statut immobilier :', error);
          if (spinner) spinner.classList.add('d-none'); // Cacher le spinner
          this.isDeletingStatus = false; // Réactiver le bouton Supprimer en cas d'erreur
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none'); // Cacher le spinner si le formulaire n'est pas valide
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadStatusImmos(): void {
    this.statusImmoService.getAllStatusImmos().subscribe(
      (data: StatusImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Status Immo', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(statusImmo =>
      statusImmo.libelle_status_immo.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editStatusImmo.patchValue({
      id:row.id,
      libelle_status_immo:row.libelle_status_immo
    })
  }

  getDeleteForm(row: any){
    this.deleteStatusImmo.patchValue({
      id:row.id,
    })
  }
}