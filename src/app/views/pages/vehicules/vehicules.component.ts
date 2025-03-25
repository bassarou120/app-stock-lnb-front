import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { VehiculeService } from '../../../core/services/vehicules/vehicules.service';
import { Vehicule, Modele, Marque  } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,FormArray  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
declare var bootstrap: any;

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,

  ],
  templateUrl: 'vehicules.component.html'
})

export class VehiculesComponent implements OnInit {

  rows: Vehicule[] = [];
  temp: Vehicule[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  modeles: Modele[] = []; // Liste des modeles
  marques: Marque[] = []; // Liste des marques

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addVehicule!: FormGroup ;
  public editVehicule!: FormGroup ;
  public deleteVehicule!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private vehiculeService: VehiculeService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadMarques();
    this.loadModeles();
    this.loadVehicules();
    this.initForm();

    this.editVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["" ,[Validators.required]],
      numero_chassis: ["" ,[Validators.required]],
      kilometrage: [0, [Validators.required]],
      date_mise_en_service: ["" ,[Validators.required]],
   });
    this.deleteVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  initForm(): void {
    this.addVehicule = this.formBuilder.group({
      vehicules: this.formBuilder.array([this.createVehiculeFormGroup()])
    });
  }
  // Getter pour accéder facilement au FormArray
  get vehiculesArray(): FormArray {
    return this.addVehicule.get('vehicules') as FormArray;
  }
  // Méthode pour créer un groupe de formulaire pour un seul vehicule
  createVehiculeFormGroup(): FormGroup {
    return this.formBuilder.group({
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["" ,[Validators.required]],
      numero_chassis: ["" ,[Validators.required]],
      kilometrage: ["", [Validators.required]],
      date_mise_en_service: ["" ,[Validators.required]],
    });
  }
  // Ajouter un nouveau groupe de vehicule
  addNewVehicule(): void {
    this.vehiculesArray.push(this.createVehiculeFormGroup());
  }
  // Supprimer un vehicule
  removeVehicule(index: number): void {
    if (this.vehiculesArray.length > 1) {
      this.vehiculesArray.removeAt(index);
    }
  }

  onClickSubmitAddVehicules(): void {
    console.log(this.addVehicule.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');

      // Convertir le FormArray en un tableau de Vehicule à envoyer
      const vehiculesToSave = this.vehiculesArray.value;

      // Créer un observable pour sauvegarder tous les Vehicule
      this.vehiculeService.saveMultipleVehicules(vehiculesToSave).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.initForm(); // Réinitialiser le formulaire avec un seul Vehicule vide

          // Fermer le modal manuellement
          const modal = document.getElementById('add_vehicule');
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
          console.error('Erreur lors de l\'ajout des Vehicules :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }



onClickSubmitEditVehicule(){
  console.log(this.editVehicule.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editVehicule.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editVehicule.value.id;
    this.vehiculeService.editVehicule(this.editVehicule.value).subscribe(
      (data: any) => {
        this.loadVehicules();
        if (spinner) spinner.classList.add('d-none');
        this.editVehicule.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_vehicule');
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
        console.error('Erreur lors de la modification du Vehicule :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteVehicule(){
  console.log(this.deleteVehicule.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteVehicule.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.vehiculeService.deleteVehicule(this.deleteVehicule.value).subscribe(
      (data: any) => {
        this.loadVehicules();
        if (spinner) spinner.classList.add('d-none');
        this.deleteVehicule.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_vehicule');
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
        console.error('Erreur lors de la supression du Vehicule :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

loadModeles(): void {
  this.vehiculeService.getAllModeles().subscribe({
    next: (data) => {
      this.modeles = data; // Stocker la liste des modeles
    },
    error: (err) => {
      console.error("Erreur lors du chargement des modeles :", err);
    }
  });
}

loadMarques(): void {
  this.vehiculeService.getAllMarques().subscribe({
    next: (data) => {
      this.marques = data; // Stocker la liste des marques
    },
    error: (err) => {
      console.error("Erreur lors du chargement des marques :", err);
    }
  });
}


loadVehicules(): void {
    this.vehiculeService.getAllVehicules().subscribe(
      (data: Vehicule[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(vehicule =>
      vehicule.immatriculation.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editVehicule.patchValue({
     id:row.id,
     marque_id:row.marque_id,
     modele_id:row.modele_id,
     immatriculation:row.immatriculation,
     numero_chassis:row.numero_chassis,
     kilometrage:row.kilometrage,
     date_mise_en_service:row.date_mise_en_service,
    })
  }

  getDeleteForm(row: any){
    this.deleteVehicule.patchValue({
     id:row.id,
    })
  }
 }


