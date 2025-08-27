import { MouvementStockService } from '../../../../core/services/mouvementstock/sortie.service';
import { MouvementStock, Article, Bureau, Employe, MouvementStockGrouped } from '../../../../core/services/interface/models';
import { CommonModule } from '@angular/common';

import { Component, ViewChild, OnInit, OnDestroy, inject, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidatorFn } from "@angular/forms";
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
// import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


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
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
    NgbDatepickerModule,
    FeatherIconDirective
  ],
})
export class SortieStockGroupedComponent implements OnInit, OnDestroy {
  private url: string = environment.backend;

  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewDemande: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canValidDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canRefuseDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canAccordDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;   // 🔥 DÉFAUT À TRUE pour éviter les blocages
  fileUrl: SafeUrl | null = null;

  mouvementsGrouped: MouvementStockGrouped[] = [];
  filteredMouvementsGrouped: MouvementStockGrouped[] = [];

  loading = false;
  expandedGroupCode: string | null = null;
  public editStatutSortie!: FormGroup;
  public edit_all!: FormGroup;
  public editvaliderDemande: FormGroup;
  quantiteDisponible: number = 0;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  // PROPRIÉTÉS POUR GÉRER L'ÉTAT DE CHARGEMENT DES BOUTONS ET PRÉVENIR LES DOUBLES CLICS
  isStatutModifLoading = false; // Pour le bouton "Confirmer" de la modal de modification de statut individuelle
  isProcessingAll = false;     // Pour le bouton "Confirmer" de la modal "Tout Traiter"

  private destroy$ = new Subject<void>();
  alertModifVisible: boolean = false;
  alertModifAllVisible: boolean = false;

  selectedMouvementCode: string | null = null;
  selectedDemandeStatut: string | null = null;
  selectedId: number | null = null;
  selectedFile: File | null = null;
  isLoading: boolean = true;

  constructor(
    private mouvementService: MouvementStockService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private el: ElementRef,
    private sanitizer: DomSanitizer // Injectez le DomSanitizer
  ) { }

  ngOnInit() {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
        // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadGroupedMouvements();
    }

    // écoute de l’événement bootstrap quand le modal se ferme
    const modal = this.el.nativeElement.querySelector('#validerlademande');
    modal.addEventListener('hidden.bs.modal', () => {
      this.resetModal();
    });

    console.log("Oui la fonction est appelée")
    this.editStatutSortie = this.formBuilder.group({
      id: [null, Validators.required],
      statut: ['', Validators.required],
      qte: ['', []],
      date_mouvement: ['', []],
      qteDemande: [1],
    });

    this.editStatutSortie.get('statut')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(statut => {
      const qteControl = this.editStatutSortie.get('qte');
      const dateMouvementControl = this.editStatutSortie.get('date_mouvement');

      if (statut === 'Accordé' || statut === 'APPROUVEE' || statut === 'TERMINER') {
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
      } else { // Si le statut n'est pas "Accordé", "APPROUVEE" ou "TERMINER", la quantité n'est pas requise
        qteControl?.clearValidators();
      }
      // La validation de la date de mouvement reste la même
      if (statut === 'Accordé' || statut === 'APPROUVEE' || statut === 'TERMINER') {
        dateMouvementControl?.setValidators([Validators.required]);
      } else {
        dateMouvementControl?.clearValidators();
      }
      qteControl?.updateValueAndValidity();
      dateMouvementControl?.updateValueAndValidity();
    });


    this.edit_all = this.formBuilder.group({
      code_mouvement: ['', Validators.required],
      date_mouvement: ['', Validators.required],
      statut: ['', Validators.required],
    });

/*     this.editvaliderDemande = this.formBuilder.group({
      code_mouvement: [null], // Le code de mouvement sera mis à jour dynamiquement
      statut: ['Valider la demande', Validators.required],
      demandevalidesigne: [null, Validators.required]
    }); */

    this.editvaliderDemande = this.formBuilder.group({
      code_mouvement: [null],
      id: [null],
      statut: ['Valider la demande', Validators.required],
      demandevalidesigne: [null, Validators.required]
    });

    // Charger les mouvements initiaux
    this.loadGroupedMouvements();

  }

  resetModal() {
    this.editvaliderDemande.reset();   // réinitialiser le formulaire
    const inputFile = this.el.nativeElement.querySelector('#demandeSigne');
    if (inputFile) inputFile.value = ''; // vider le champ fichier
  }

  // Propriété calculée pour les statuts disponibles
  get availableStatuts(): string[] {
    const statuts: string[] = ['En attente']; // Toujours disponible

    if (this.canValidDemande) {
      statuts.push('Validé');
    }
    if (this.canRefuseDemande) {
      statuts.push('Refusé');
    }
    if (this.canAccordDemande) {
      statuts.push('Accordé');
    }

    return statuts;
  }



  selectMouvement(code: string): void {
    this.selectedMouvementCode = code;
    this.selectedId = null;
    this.editvaliderDemande.reset({
      code_mouvement: code,
      id: null,
      statut: 'Valider la demande'
    });
    this.selectedFile = null;
  }

  selectedStatut(statut: string): void {
    this.selectedDemandeStatut = statut;
  }



    // NEW function to select a single detail
  selectDetail(id: number, mouvementCode: string): void {
    this.selectedMouvementCode = mouvementCode;
    this.selectedId = id;
    this.editvaliderDemande.reset({
      code_mouvement: mouvementCode,
      id: id,
      statut: 'Valider la demande'
    });
    this.selectedFile = null;
  }

    // Fonction pour trouver le détail dans le tableau
  private findDetailById(id: number, groupedMouvements: any[]): any {
    for (const group of groupedMouvements) {
      const detail = group.details.find((d: any) => d.id === id);
      if (detail) {
        return detail;
      }
    }
    return null;
  }

    // --- NOUVELLE FONCTION POUR OUVRIR LE FICHIER ---
  viewFile(filePath: string): void {
    this.mouvementService.getFile(filePath);
  }

  // 🔥 NOUVELLE MÉTHODE : Initialiser les permissions
  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return; // Garder les permissions par défaut (true)
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      // 🔥 VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
      this.canViewDemande = allowedFonctionnalites.includes('Voir Les demandes');
      this.canValidDemande = allowedFonctionnalites.includes('Validation de demande');
      this.canRefuseDemande = allowedFonctionnalites.includes('Refus de demande');
      this.canAccordDemande = allowedFonctionnalites.includes('Accorder de demande');
      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewDemande ;

      console.log('🔐 Permissions calculées:', {
        canViewDemande: this.canViewDemande,
        canValidDemande: this.canValidDemande,
        canRefuseDemande: this.canRefuseDemande,
        canAccordDemande: this.canAccordDemande,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des demandes de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    const modal = this.el.nativeElement.querySelector('#validerlademande');
    if (modal) {
      modal.removeEventListener('hidden.bs.modal', this.resetModal);
    }
  }

  openToutTraiterModal(code: string) {
    this.edit_all.reset();
    this.edit_all.patchValue({
      code_mouvement: code,
      date_mouvement: this.currentDate
    });
    this.edit_all.markAsUntouched();
    this.edit_all.markAsPristine();
  }


/*   loadGroupedMouvements() {
    this.loading = true;
    this.mouvementService.getSortieStockGrouped().pipe(takeUntil(this.destroy$)).subscribe({
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
  } */


loadGroupedMouvements() {
  this.isLoading = true; // Activate the spinner
  this.mouvementService.getSortieStockGrouped().subscribe({
    next: (response) => { // Change 'data' to 'response' for clarity
      // Check if the response contains a 'data' property
      if (response && response.data) {
        // Correctly assign the array from the 'data' property
        this.filteredMouvementsGrouped = response.data;
        this.isLoading = false; // Deactivate the spinner
      } else {
        // Handle cases where the response format is unexpected
        console.error('API response format is incorrect.', response);
        alert('Erreur de chargement des données. Format de réponse invalide.');
        this.isLoading = false;
      }
    },
    error: (error) => {
      // Handle API errors
      console.error('Erreur lors du chargement des mouvements groupés:', error);
      alert('Erreur de chargement des données. Veuillez réessayer plus tard.');
      this.isLoading = false;
    }
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
      group.bureau.toLowerCase().includes(val) ||
      group.details.some(detail =>
        (detail.article?.libelle || '').toLowerCase().includes(val) ||
        (detail.description || '').toLowerCase().includes(val)
      )
    );
  }

onFileSelected(event: any): void {
  const file: File = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    // You can still set the form control value if you want to track it, but it's optional
    this.editvaliderDemande.get('demandevalidesigne')?.setValue(file);
  }
}

// The upload function will now check which ID to use
  uploadSignedFile(): void {
    if (this.editvaliderDemande.invalid) {
      console.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isProcessingAll = true;

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('demandevalidesigne', this.selectedFile, this.selectedFile.name);
    } else {
      console.error('Aucun fichier sélectionné.');
      this.isProcessingAll = false;
      return;
    }

    formData.append('statut', 'Validé');

    if (this.selectedId) {
      formData.append('id', this.selectedId.toString());
    } else if (this.selectedMouvementCode) {
      formData.append('code_mouvement', this.selectedMouvementCode);
    } else {
      console.error('Erreur: Aucun élément sélectionné pour la validation.');
      this.isProcessingAll = false;
      return;
    }

    this.mouvementService.uploadSignedFile(formData).subscribe({
      next: (response) => {
        console.log('Upload réussi', response);

        // Mise à jour directe de l'objet dans le tableau
        if (this.selectedId) {
          const updatedDetail = this.findDetailById(this.selectedId, this.filteredMouvementsGrouped);
          if (updatedDetail) {
            updatedDetail.statut = response.new_statut;
            updatedDetail.demandevalidesigne = response.file_path; // C'est ici que l'URL est stockée
            console.log('Ligne mise à jour directement:', updatedDetail);
          }
        }

        this.isProcessingAll = false;
        this.editvaliderDemande.reset();
        this.selectedFile = null;
        this.selectedId = null;
        this.selectedMouvementCode = null;

        const modal = document.getElementById('validerlademande');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
          bootstrapModal.hide();
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur d\'upload', error);
        this.isProcessingAll = false;
      }
    });
  }

  downloadGroupedFile(code: string): void {
    this.mouvementService.downloadGroupedFile(code);
  }


  getStatutForm(detail: MouvementStock): void {
    console.log('--- Démarrage getStatutForm ---');
    console.log('Objet "detail" complet reçu :', detail);
    console.log('Valeur de detail.id_Article :', detail.id_Article);
    console.log('Valeur de detail.qteDemande (QUANTITÉ INITIALEMENT DEMANDÉE) :', detail.qteDemande); // C'est la clé !
    console.log('Valeur de detail.qte (QUANTITÉ DÉJÀ ACCORDÉE/SAISIE) :', detail.qte); // Utile aussi
    const idArticle = detail.id_Article;
    console.log('ID de l\'article sélectionné pour statut:', idArticle);

    if (idArticle) {
      this.mouvementService.getQuantiteDisponible(idArticle).pipe(takeUntil(this.destroy$)).subscribe(
        (response: any) => {
          console.log('Quantité disponible pour statut:', response.data);
          this.quantiteDisponible = response.data;
          this.patchEditStatutSortieForm(detail);
        },
        (error: any) => {
          console.error('Erreur lors de la récupération de la quantité disponible pour statut:', error);
          this.quantiteDisponible = 0;
          alert('Impossible de récupérer la quantité disponible pour cet article.');
          this.patchEditStatutSortieForm(detail);
        }
      );
    } else {
      this.quantiteDisponible = 0;
      this.patchEditStatutSortieForm(detail);
    }
  }

  private patchEditStatutSortieForm(detail: MouvementStock): void {
    const valueForQteInput = detail.qte || detail.qteDemande || '';
    console.log('--- Démarrage patchEditStatutSortieForm ---');
    console.log('Valeur de detail.qteDemande pour patchage :', detail.qteDemande);
    console.log('Valeur de detail.qte pour patchage :', detail.qte);
    console.log('Valeur FINALE qui va être patchée dans le champ "qte" :', valueForQteInput);
    this.editStatutSortie.patchValue({
      id: detail.id,
      statut: detail.statut,
      qte: detail.qte || detail.qteDemande || '',
      date_mouvement: detail.date_mouvement ? this.convertToNgbDate(detail.date_mouvement) : null,
      qteDemande: detail.qteDemande
    });
    console.log('Valeur du FormControl "qte" après patch :', this.editStatutSortie.get('qte')?.value);
    this.editStatutSortie.get('statut')?.updateValueAndValidity();
    this.editStatutSortie.get('qte')?.updateValueAndValidity();
    this.editStatutSortie.get('date_mouvement')?.updateValueAndValidity();
    this.editStatutSortie.markAsUntouched();
    this.editStatutSortie.markAsPristine();
  }


  formatDate(date: NgbDateStruct): string | null {
    if (!date) return null;
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return {
        year: +parts[0],
        month: +parts[1],
        day: +parts[2],
      };
    }
    return null;
  }

  //POUR LA VALIDATION UNIQUE
  onClickSubmitEditStatutSortie_BON(): void {
    if (this.isStatutModifLoading) {
      console.warn('Soumission de modification de statut déjà en cours. Opération annulée.');
      return;
    }

    if (this.editStatutSortie.invalid) {
      // ... votre logique de validation et d'alerte existante ...
      return;
    }

    this.isStatutModifLoading = true;

    const id = this.editStatutSortie.value.id;
    const formData = {
      ...this.editStatutSortie.value,
      date_mouvement: this.editStatutSortie.value.date_mouvement ? this.formatDate(this.editStatutSortie.value.date_mouvement) : null,
    };
    delete formData.id;
    delete formData.qteDemande;

    this.mouvementService.updateDemandeStock(id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Demande mise à jour avec succès.', response);

          // ✨ ÉTAPE CLÉ : Appel pour générer la fiche PDF après la réussite de la mise à jour.
          this.mouvementService.genererFichePDF(id).subscribe({
            next: (pdfBlob) => {
              const url = window.URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `fiche-demande-sortie-${id}.pdf`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            },
            error: (pdfError) => {
              console.error('Erreur lors de la génération du PDF:', pdfError);
              alert("La mise à jour a réussi, mais une erreur est survenue lors de la génération du PDF.");
            }
          });

          this.loadGroupedMouvements();
          this.editStatutSortie.reset();
          this.isStatutModifLoading = false;

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
          this.isStatutModifLoading = false;
          alert(error.error?.error || "Une erreur s'est produite. Veuillez réessayer.");
        }
      });
    }

      // NOUVELLE LOGIQUE pour la soumission du formulaire de statut
// NOUVELLE LOGIQUE pour la soumission du formulaire de statut
  onClickSubmitEditStatutSortie(): void {
    if (this.isStatutModifLoading) {
      console.warn('Soumission de modification de statut déjà en cours. Opération annulée.');
      return;
    }

    if (this.editStatutSortie.invalid) {
      // ... votre logique de validation et d'alerte existante ...
      return;
    }

    this.isStatutModifLoading = true;

    const id = this.editStatutSortie.value.id;
    const formData = {
      ...this.editStatutSortie.value,
      date_mouvement: this.editStatutSortie.value.date_mouvement ? this.formatDate(this.editStatutSortie.value.date_mouvement) : null,
    };
    delete formData.id;
    delete formData.qteDemande;

    this.mouvementService.updateDemandeStock(id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Demande mise à jour avec succès.', response);

          // ✨ NOUVELLE ÉTAPE CLÉ : Ouvrir directement l'URL de l'API dans un nouvel onglet.
          const pdfUrl = `${this.url}/mouvements/fiche/${id}`;
          window.open(pdfUrl, '_blank');

          this.loadGroupedMouvements();
          this.editStatutSortie.reset();
          this.isStatutModifLoading = false;

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
          this.isStatutModifLoading = false;
          alert(error.error?.error || "Une erreur s'est produite. Veuillez réessayer.");
        }
      });
  }


// POUR LA VALIDATION DU GROUPE COMPLET
  onClickSubmitEditAllSortie() {
      // EMPÊCHEMENT DE CLICS MULTIPLES (basé sur l'exemple de EntreeComponent)
      if (this.isProcessingAll) {
        console.warn('Soumission "Tout Traiter" déjà en cours. Opération annulée.');
        return;
      }

      if (this.edit_all.invalid) {
        this.markFormGroupTouched(this.edit_all);
        alert("Désolé, le formulaire n'est pas bien renseigné.");
        return;
      }

      this.isProcessingAll = true;

      const formData = {
        ...this.edit_all.value,
        date_mouvement: this.formatDate(this.edit_all.value.date_mouvement),
      };

      this.mouvementService.validerDemandeGroupee(formData).pipe(takeUntil(this.destroy$)).subscribe(
        (data: any) => {
          this.isProcessingAll = false;

          // Fermer le modal
          const modal = document.getElementById('tout_traiter');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Vérifier le succès et déclencher le téléchargement de la fiche
          if (data && data.code_mouvement) {
              // Déclenche le téléchargement du PDF dans une nouvelle fenêtre
              window.open(`${this.url}/generer-fiche-demande/${data.code_mouvement}`, '_blank');

          }

          this.loadGroupedMouvements(); // Rafraîchit les données après le traitement
          this.edit_all.reset();

          setTimeout(() => {
            this.alertModifAllVisible = true;
            setTimeout(() => {
              this.alertModifAllVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          this.isProcessingAll = false;
          alert(error.error?.error || "Une erreur s'est produite lors du traitement groupé. Veuillez réessayer.");
        }
      );
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

// Ajoutez cette nouvelle fonction à votre composant
  isGroupInProgress(group: any): boolean {
    const hasProcessedItems = group.details.some((detail: any) =>
      detail.statut === 'Accordé' || detail.statut === 'Validé'
    );
    const hasUntreatedItems = group.details.some((detail: any) =>
      detail.statut === 'À traiter'
    );
    return hasProcessedItems && hasUntreatedItems;
  }
  
  // Cette fonction est maintenant utilisée pour le bouton "Tout traiter"
  isGroupPartiallyProcessed(group: any): boolean {
    return group.details.some((detail: any) => detail.statut === 'Accordé' || detail.statut === 'Validé');
  }

  // Vérifie si TOUS les éléments du groupe sont traités
  isGroupCompletelyProcessed(group: any): boolean {
    return group.details.every((detail: any) =>
      detail.statut === 'Accordé' || detail.statut === 'Validé'
    );
  }

    // Nouvelle fonction pour la logique du bouton d'upload
  isUploadActive(group: any): boolean {
    const isCompletelyProcessed = this.isGroupCompletelyProcessed(group);
    return isCompletelyProcessed;
  }







}
