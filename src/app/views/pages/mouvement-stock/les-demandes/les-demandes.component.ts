import { MouvementStockService } from '../../../../core/services/mouvementstock/sortie.service';
import { MouvementStock, Article, Bureau, Employe, MouvementStockGrouped } from '../../../../core/services/interface/models';
import { CommonModule } from '@angular/common';

import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidatorFn } from "@angular/forms";
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { Subject, takeUntil } from 'rxjs'; // Importez Subject et takeUntil
import { map } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-sortie',
  standalone: true,
  templateUrl: 'les-demandes.component.html',
  imports: [
    CommonModule,
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule, // Assurez-vous que c'est bien ReactiveFormsModule ici
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
    NgbDatepickerModule,
    FeatherIconDirective
  ],
})
export class SortieStockGroupedComponent implements OnInit, OnDestroy { // Implémentez OnDestroy pour gérer destroy$
  mouvementsGrouped: MouvementStockGrouped[] = [];
  filteredMouvementsGrouped: MouvementStockGrouped[] = [];
  loading = false;
  expandedGroupCode: string | null = null;
  public editStatutSortie!: FormGroup;
  public edit_all!: FormGroup;
  quantiteDisponible: number = 0;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  isStatutModifLoading = false;
  // NOUVELLE PROPRIÉTÉ POUR LE BOUTON "TOUT TRAITER"
  isProcessingAll = false;

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
      qte: ['', []], // Rendu optionnel initialement
      date_mouvement: ['', []], // Rendu optionnel initialement
      qteDemande: [1, [Validators.required]],
    });

    // Ajout de la gestion de la validation conditionnelle pour editStatutSortie
    this.editStatutSortie.get('statut')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(statut => {
      const qteControl = this.editStatutSortie.get('qte');
      const dateMouvementControl = this.editStatutSortie.get('date_mouvement');

      if (statut === 'APPROUVEE' || statut === 'TERMINER') { // Ou seulement 'APPROUVEE' selon votre logique
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible) // Appliquer le max en fonction de la quantité dispo
        ]);
        dateMouvementControl?.setValidators([Validators.required]);
      } else {
        qteControl?.clearValidators();
        dateMouvementControl?.clearValidators();
      }
      qteControl?.updateValueAndValidity();
      dateMouvementControl?.updateValueAndValidity();
    });


    this.edit_all = this.formBuilder.group({
      code_mouvement: ['', Validators.required],
      date_mouvement: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openToutTraiterModal(code: string) {
    this.edit_all.reset();
    this.edit_all.patchValue({
      code_mouvement: code,
      date_mouvement: this.currentDate // Pré-remplir avec la date actuelle
    });
    // S'assurer que le formulaire est "propre" au moment de l'ouverture
    this.edit_all.markAsUntouched();
    this.edit_all.markAsPristine();
  }


  loadGroupedMouvements() {
    this.loading = true;
    this.mouvementService.getSortieStockGrouped().pipe(takeUntil(this.destroy$)).subscribe({ // Ajout de takeUntil
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

  // updateFilter(event: any): void {
  //   const val = event.target.value.toLowerCase();

  //   this.filteredMouvementsGrouped = this.mouvementsGrouped.filter(group =>
  //     group.code_mouvement.toLowerCase().includes(val) ||
  //     group.personnel.toLowerCase().includes(val) ||
  //     group.bureau.toLowerCase().includes(val) ||
  //     group.details.some(detail => detail.article.libelle.toLowerCase().includes(val)) || // Filtrer par article
  //     group.details.some(detail => detail.description.toLowerCase().includes(val)) // Filtrer par description
  //   );
  // }

  updateFilter(event: any): void {
    const val = event.target.value.toLowerCase();

    this.filteredMouvementsGrouped = this.mouvementsGrouped.filter(group =>
      group.code_mouvement.toLowerCase().includes(val) ||
      group.personnel.toLowerCase().includes(val) ||
      group.bureau.toLowerCase().includes(val)
    );
  }


  getStatutForm(detail: MouvementStock): void {
    // Charger la quantité disponible AVANT de patcher les valeurs
    const idArticle = detail.id_Article;
    console.log('ID de l\'article sélectionné pour statut:', idArticle);

    if (idArticle) {
      this.mouvementService.getQuantiteDisponible(idArticle).pipe(takeUntil(this.destroy$)).subscribe( // Ajout de takeUntil
        (response: any) => {
          console.log('Quantité disponible pour statut:', response.data);
          this.quantiteDisponible = response.data;
          // Une fois la quantité disponible chargée, patcher les valeurs du formulaire
          this.patchEditStatutSortieForm(detail);
        },
        (error: any) => {
          console.error('Erreur lors de la récupération de la quantité disponible pour statut:', error);
          this.quantiteDisponible = 0; // Réinitialiser en cas d'erreur
          alert('Impossible de récupérer la quantité disponible pour cet article.');
          this.patchEditStatutSortieForm(detail); // Patcher quand même même s'il y a une erreur pour les autres champs
        }
      );
    } else {
      this.quantiteDisponible = 0; // Aucun article, pas de quantité
      this.patchEditStatutSortieForm(detail);
    }
  }

  private patchEditStatutSortieForm(detail: MouvementStock): void {
    this.editStatutSortie.patchValue({
      id: detail.id,
      statut: detail.statut,
      qte: detail.qte || '', // Pré-remplir qte si déjà définie, sinon vide
      date_mouvement: detail.date_mouvement ? this.convertToNgbDate(detail.date_mouvement) : null,
      qteDemande: detail.qteDemande // Afficher la quantité demandée
    });
    // Déclencher la mise à jour des validateurs après le patchValue
    this.editStatutSortie.get('statut')?.updateValueAndValidity();
    this.editStatutSortie.get('qte')?.updateValueAndValidity();
    this.editStatutSortie.get('date_mouvement')?.updateValueAndValidity();
  }


  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  onClickSubmitEditStatutSortie(): void {
    // Prévention des doubles clics
    if (this.isStatutModifLoading) {
      console.warn('Soumission de modification de statut déjà en cours. Opération annulée.');
      return;
    }

    const spinner = document.querySelector('#edit_statut_sortie .spinnerStatutModif');

    if (this.editStatutSortie.valid) {
      this.isStatutModifLoading = true;
      if (spinner) spinner.classList.remove('d-none');

      const id = this.editStatutSortie.value.id;
      const formData = {
        ...this.editStatutSortie.value,
        date_mouvement: this.editStatutSortie.value.date_mouvement ? this.formatDate(this.editStatutSortie.value.date_mouvement) : null,
      };
      delete formData.id; // Ne pas envoyer l'ID dans le corps si l'API l'attend dans l'URL
      delete formData.qteDemande; // Supprimer si non nécessaire pour l'API de mise à jour

      this.mouvementService.updateDemandeStock(id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loadGroupedMouvements();
            if (spinner) spinner.classList.add('d-none');
            this.editStatutSortie.reset();
            this.isStatutModifLoading = false; // Réactiver le bouton

            const modal = document.getElementById('edit_statut_sortie');
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal?.hide();

            setTimeout(() => {
              this.alertModifVisible = true;
              setTimeout(() => {
                this.alertModifVisible = false;
              }, 2000);
            }, 200);
          },
          error: (error: any) => {
            console.error('Erreur lors de la modification du statut :', error);
            if (spinner) spinner.classList.add('d-none');
            this.isStatutModifLoading = false; // Réactiver le bouton
            alert(error.error?.error || "Une erreur s'est produite. Veuillez réessayer.");
          }
        });
    } else {
      if (spinner) spinner.classList.add('d-none');
      // Marquer les champs comme touchés pour afficher les messages de validation
      this.markFormGroupTouched(this.editStatutSortie);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.");
    }
  }

  onClickSubmitEditAllSortie() {
    // Prévention des doubles clics
    if (this.isProcessingAll) {
      console.warn('Soumission "Tout Traiter" déjà en cours. Opération annulée.');
      return;
    }

    const spinner = document.querySelector('.spinner-process-all'); // Utilisez le nouveau sélecteur spécifique

    if (this.edit_all.valid) {
      this.isProcessingAll = true;
      if (spinner) spinner.classList.remove('d-none');

      const formData = {
        ...this.edit_all.value,
        date_mouvement: this.formatDate(this.edit_all.value.date_mouvement), // Convertir la date
      };

      this.mouvementService.validerDemandeGroupee(formData).pipe(takeUntil(this.destroy$)).subscribe( // Ajout de takeUntil
        (data: any) => {
          this.loadGroupedMouvements();
          if (spinner) spinner.classList.add('d-none');
          this.edit_all.reset();
          this.isProcessingAll = false; // Réactiver le bouton

          const modal = document.getElementById('tout_traiter');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifAllVisible = true;
            setTimeout(() => {
              this.alertModifAllVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          if (spinner) spinner.classList.add('d-none');
          this.isProcessingAll = false; // Réactiver le bouton
          alert(error.error?.error || "Une erreur s'est produite lors du traitement groupé. Veuillez réessayer.");
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      // Marquer les champs comme touchés pour afficher les messages de validation
      this.markFormGroupTouched(this.edit_all);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isGroupTraitable(group: MouvementStockGrouped): boolean {
    // Cette fonction semble vérifier si au moins un détail n'a pas le statut 'Accordé'
    // Je suppose que 'Accordé' est le statut final et qu'on ne peut plus traiter si tout est 'Accordé'
    return group.details?.some(detail => detail.statut !== 'Accordé');
    // Ou si vous voulez dire "pas encore traité", vous pourriez avoir une autre logique
    // Exemple: return group.details?.some(detail => detail.statut === 'EN_ATTENTE');
  }

}