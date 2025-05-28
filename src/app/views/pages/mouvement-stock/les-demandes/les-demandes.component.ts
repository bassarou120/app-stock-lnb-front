
import { MouvementStockService } from '../../../../core/services/mouvementstock/sortie.service';
import { MouvementStock, Article, Bureau, Employe, MouvementStockGrouped } from '../../../../core/services/interface/models';
// import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { Subject, takeUntil } from 'rxjs'; // Importez Subject et takeUntil
import { map } from 'rxjs/operators';
import { AbstractControl, ValidatorFn } from '@angular/forms';

declare var feather: any;
declare var bootstrap: any;

@Component({
  selector: 'app-sortie',
  standalone: true,
  templateUrl: 'les-demandes.component.html',
  imports: [
    CommonModule,
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
    NgbDatepickerModule,
    FeatherIconDirective
  ],
})
export class SortieStockGroupedComponent implements OnInit {
  mouvementsGrouped: MouvementStockGrouped[] = [];
  filteredMouvementsGrouped: MouvementStockGrouped[] = [];
  loading = false;
  expandedGroupCode: string | null = null;
  public editStatutSortie!: FormGroup;
  public edit_all!: FormGroup;
  quantiteDisponible: number = 0;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  isStatutModifLoading = false;
  private destroy$ = new Subject<void>();
  alertModifVisible: boolean = false;
  alertModifAllVisible: boolean = false;


  constructor(private mouvementService: MouvementStockService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.loadGroupedMouvements();
    console.log("Oui la fonction est appelée")
    this.editStatutSortie = this.formBuilder.group({
      id: [null, Validators.required],
      statut: ['', Validators.required],
      qte: ['', Validators.required],
      date_mouvement: ['', Validators.required],
      qteDemande: [1, [Validators.required]],
    });
    this.edit_all = this.formBuilder.group({
      code_mouvement: ['', Validators.required],
      date_mouvement: ['', Validators.required],
      statut: ['', Validators.required],
    });
  }

  openToutTraiterModal(code: string) {
    this.edit_all.reset();
    this.edit_all.patchValue({
      code_mouvement: code
    });
  }


  loadGroupedMouvements() {
    this.loading = true;
    this.mouvementService.getSortieStockGrouped().subscribe({
      next: (res) => {
        if (res.success) {
          this.mouvementsGrouped = res.data;
          this.filteredMouvementsGrouped = res.data;
        } else {
          alert('Erreur : ' + res.message);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur serveur ou réseau');
        this.loading = false;
      },
    });
  }

  toggleGroup(code: string) {
  this.expandedGroupCode = this.expandedGroupCode === code ? null : code;
}

  updateFilter(event: any): void {
    const val = event.target.value.toLowerCase();

    this.filteredMouvementsGrouped = this.mouvementsGrouped.filter(group =>
      group.code_mouvement.toLowerCase().includes(val) ||
      group.personnel.toLowerCase().includes(val) ||
      group.bureau.toLowerCase().includes(val)
    );
  }




  getStatutForm(detail: MouvementStock): void {
    this.editStatutSortie.patchValue({
      id: detail.id,
      statut: detail.statut,
      qteDemande: detail.qteDemande
    });

    const idArticle = detail.id_Article;
    console.log('ID de l\'article sélectionné:', idArticle);

    if (!idArticle) {
      console.log('Aucun article sélectionné ou désélection effectuée');
      this.quantiteDisponible = 0;
      return;
    }

    this.mouvementService.getQuantiteDisponible(idArticle).subscribe(
      (response: any) => { // Typez la réponse
        console.log('Quantité disponible:', response.data);
        this.quantiteDisponible = response.data;

        // 🔥 On met à jour le validateur max du champ qte
        const qteControl = this.editStatutSortie.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();

      },
      (error: any) => {
        console.error('Erreur lors de la récupération de la quantité disponible:', error);
        this.quantiteDisponible = 0;
      }
    );
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }

  onClickSubmitEditStatutSortie(): void {
    const spinner = document.querySelector('#edit_statut_sortie .spinnerStatutModif');

    if (this.editStatutSortie.valid) {
      this.isStatutModifLoading = true;
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editStatutSortie.value.id;
      const formData = {
        ...this.editStatutSortie.value,
        date_mouvement: this.formatDate(this.editStatutSortie.value.date_mouvement), // Convertir la date
      };
      delete formData.id;

      this.mouvementService.updateDemandeStock(id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loadGroupedMouvements();
            if (spinner) spinner.classList.add('d-none');
            this.editStatutSortie.reset();

            // Fermer le modal manuellement (selon votre exemple)
            const modal = document.getElementById('edit_statut_sortie');
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal?.hide();

            // Attendre que le modal soit fermé avant d'afficher l'alerte (selon votre exemple)
            setTimeout(() => {
              this.alertModifVisible = true;
              console.log('Alert visible après fermeture du modal:', this.alertModifVisible);
              setTimeout(() => {
                this.alertModifVisible = false;
              }, 2000); // L'alerte disparaît après 2 secondes
            }, 200); // L'alerte apparaît 200ms après la fermeture du modal

            this.isStatutModifLoading = false;
          },
          error: (error: any) => {
            console.error('Erreur lors de la modification du statut :', error);
            if (spinner) spinner.classList.add('d-none');
            this.isStatutModifLoading = false;
            alert('Une erreur s\'est produite. Veuillez réessayer.'); // Gestion de l'erreur selon votre exemple
          }
        });
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné"); // Gestion de l'erreur de validation selon votre exemple
      Object.keys(this.editStatutSortie.controls).forEach(key => {
        this.editStatutSortie.get(key)?.markAsTouched();
      });
    }
  }

  onClickSubmitEditAllSortie() {
    console.log(this.edit_all.value);
    const spinner = document.querySelector('.spinnerStatutModifAll');

    if (this.edit_all.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.edit_all.value,
        date_mouvement: this.formatDate(this.edit_all.value.date_mouvement), // Convertir la date
      };
      this.mouvementService.validerDemandeGroupee(formData).subscribe(
        (data: any) => {
          this.loadGroupedMouvements();
          if (spinner) spinner.classList.add('d-none');
          this.edit_all.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('tout_traiter');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertModifAllVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertModifAllVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertModifAllVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          // console.error('Erreur lors de l\'ajout de la sortie :', error);
          // if (spinner) spinner.classList.add('d-none');
          // alert('Une erreur s\'est produite. Veuillez réessayer.');

          if (spinner) spinner.classList.add('d-none');

          // Afficher directement le message d'erreur de l'API
          alert(error.error?.error || "Une erreur s'est produite. Veuillez réessayer.");
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  isGroupTraitable(group: MouvementStockGrouped): boolean {
  return group.details?.every(detail => detail.statut !== 'Accordé');
}

}
