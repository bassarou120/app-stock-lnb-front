import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { GroupeTypeImmoService } from '../../../../core/services/groupe-type-immo/groupe-type-immo.service';
import { SousTypeImmo, GroupeTypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
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
    MyNgSelectComponent,
    
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

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addGroupeTypeImmo!: FormGroup ;
  public editGroupeTypeImmo!: FormGroup ;
  public deleteGroupeTypeImmo!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private groupeTypeImmoService: GroupeTypeImmoService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadSousTypeImmos();
    this.loadGroupeTypeImmos();
    this.addGroupeTypeImmo = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.editGroupeTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_sous_type_immo: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.deleteGroupeTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  onClickSubmitAddGroupeTypeImmo() {
  console.log(this.addGroupeTypeImmo.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addGroupeTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.groupeTypeImmoService.saveGroupeTypeImmo(this.addGroupeTypeImmo.value).subscribe(
      (data: any) => {
        this.loadGroupeTypeImmos();
        if (spinner) spinner.classList.add('d-none');
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

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de l\'ajout du groupe type d\'immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditGroupeTypeImmo(){
  console.log(this.editGroupeTypeImmo.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editGroupeTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editGroupeTypeImmo.value.id;
    this.groupeTypeImmoService.editGroupeTypeImmo(this.editGroupeTypeImmo.value).subscribe(
      (data: any) => {
        this.loadGroupeTypeImmos();
        if (spinner) spinner.classList.add('d-none');
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

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de la modification du groupe type d\'Immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteGroupeTypeImmo(){
  console.log(this.deleteGroupeTypeImmo.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteGroupeTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.groupeTypeImmoService.deleteGroupeTypeImmo(this.deleteGroupeTypeImmo.value).subscribe(
      (data: any) => {
        this.loadGroupeTypeImmos();
        if (spinner) spinner.classList.add('d-none');
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

          // Utilisation de la transition pour faire apparaitre l'alerte
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de la supression du groupe Type d\'Immo :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

loadSousTypeImmos(): void {
  this.groupeTypeImmoService.getAllSousTypeImmos().subscribe({
    next: (data) => {
      this.sousTypeImmos = data; // Stocker la liste des sous types d'immos
    },
    error: (err) => {
      console.error("Erreur lors du chargement des types sous d'immos :", err);
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


