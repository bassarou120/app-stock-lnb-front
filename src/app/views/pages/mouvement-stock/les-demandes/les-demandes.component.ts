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
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';

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
selectedCodeMouvement: string = '';
  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewDemande: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canValidDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canRefuseDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canAccordDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;   // 🔥 DÉFAUT À TRUE pour éviter les blocages


  mouvementsGrouped: MouvementStockGrouped[] = [];
  filteredMouvementsGrouped: MouvementStockGrouped[] = [];
  loading = false;
  expandedGroupCode: string | null = null;
  public editStatutSortie!: FormGroup;
  public edit_all!: FormGroup;
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
  listOfAvailableFiles: string[] = [];

  selectedStatus: string = 'Tous';


  public editvaliderDemande!: FormGroup;


  constructor(
    private mouvementService: MouvementStockService,
    private formBuilder: FormBuilder,
    private modalService: NgbModal,
    private router: Router
  ) { }

  ngOnInit() {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
        // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadGroupedMouvements();
    }


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

      this.editvaliderDemande = this.formBuilder.group({
      code_mouvement: [null],
      id: [null],
      statut: ['Valider la demande', Validators.required],
      demandevalidesigne: [null, Validators.required]
      });
  }

  // Propriété calculée pour les statuts disponibles
  get availableStatuts(): string[] {
    const statuts: string[] = ['En attente']; // Toujours disponible

    if (this.canValidDemande) {
      statuts.push('Cloturé');
    }
    if (this.canRefuseDemande) {
      statuts.push('Refusé');
    }
    if (this.canAccordDemande) {
      statuts.push('Accordé');
    }

    return statuts;
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openToutTraiterModal(code: string) {
     this.selectedCodeMouvement = code;
    this.edit_all.reset();
    this.edit_all.patchValue({
      code_mouvement: code,
      date_mouvement: this.currentDate
    });
    this.edit_all.markAsUntouched();
    this.edit_all.markAsPristine();
  }

  // Ajoutez cette nouvelle fonction à votre composant
  isGroupInProgress(group: any): boolean {
    const hasProcessedItems = group.details.some((detail: any) =>
      detail.statut === 'Accordé' || detail.statut === 'Cloturé'
    );
    const hasUntreatedItems = group.details.some((detail: any) =>
      detail.statut === 'À traiter'
    );
    return hasProcessedItems && hasUntreatedItems;
  }

  // Cette fonction est maintenant utilisée pour le bouton "Tout traiter"
  isGroupPartiallyProcessed(group: any): boolean {
    return group.details.some((detail: any) => detail.statut === 'Accordé' || detail.statut === 'Cloturé');
  }

  // Vérifie si TOUS les éléments du groupe sont traités
  isGroupCompletelyProcessed(group: any): boolean {
    return group.details.every((detail: any) => detail.statut !== 'En attente');
  }

  onFileSelected(event: any): void {
  const file: File = event.target.files[0];
  if (file) {
    this.selectedFile = file;
    // You can still set the form control value if you want to track it, but it's optional
    this.editvaliderDemande.get('demandevalidesigne')?.setValue(file);
  }
}

// Dans votre classe du composant (votre .ts)
hasGroupFile(group: any): boolean {
  return !!group.file_path && group.file_path.trim() !== '';
}

  viewFile(filePath: string): void {
    this.mouvementService.getFile(filePath);
  }

    // Nouvelle fonction pour la logique du bouton d'upload
  isUploadActive(group: any): boolean {
    const isCompletelyProcessed = this.isGroupCompletelyProcessed(group);
    return isCompletelyProcessed;
  }

  generatedGroups: Set<string> = new Set();

  checkStatusAndGenerate(code: string): void {
    this.mouvementService.verifieStatus(code).subscribe({
      next: (res: Blob) => {
        // Vérifier si la réponse est un JSON ou un PDF
        const isJson = res.type === "application/json";

        if (isJson) {
          const reader = new FileReader();
          reader.onload = () => {
            const json = JSON.parse(reader.result as string);
            Swal.fire({
              title: 'Erreur',
              text: 'Erreur lors de la vérification du statut.',
              icon: 'error',
              confirmButtonText: 'Réessayer',
              confirmButtonColor: '#d33'
            });
          };
          reader.readAsText(res);
        } else {
          // C’est un PDF → on l’ouvre
          const fileURL = URL.createObjectURL(res);
          window.open(fileURL);
        }
      },
      error: (error: any) => {
                console.error("Erreur lors de la vérification/génération :", error);
               
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez réessayer. Si le problème persiste, contactez le support technique.';

                if (error.status === 404) {
                  // L'objet (Mouvement, Immobilisation, etc.) pour lequel on demande le statut n'existe pas.
                  detail = 'L\'élément (code: ' + code + ') est introuvable sur le serveur.';
                } else if (error.status === 400) {
                  // Erreur côté client (ex: code invalide, données manquantes)
                  detail = 'Erreur de requête. Vérifiez le code fourni et assurez-vous que toutes les données sont valides.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion. Impossible de contacter le serveur.';
                } else if (error.error && error.error.message) {
                  // Tente d'afficher un message spécifique du serveur
                  detail = `Erreur Serveur: ${error.error.message}`;
                }

                // Message final clair
                Swal.fire({
                  title: 'Erreur',
                  text: 'La vérification du statut ou la génération du document a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, contactez le support technique.',
                  icon: 'error',
                  confirmButtonText: 'Réessayer',
                  confirmButtonColor: '#d33'
                });
              }
    });
  }



  downloadGroupedFile(code: string): void {
    this.mouvementService.downloadGroupedFile(code);
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

  // --- NOUVELLE FONCTION POUR OUVRIR LE FICHIER ---


  fileExists(code_mouvement: string): boolean {
  // ⚡ Ici tu adaptes selon ta logique (ex : vérifier dans une liste des fichiers générés)
    return this.listOfAvailableFiles.includes(code_mouvement);
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

    formData.append('statut', 'Cloturé');

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

        // Mise à jour du détail si c'est un détail spécifique (par ID)
        if (this.selectedId) {
          const updatedDetail = this.findDetailById(this.selectedId, this.filteredMouvementsGrouped);
          if (updatedDetail) {
            console.log("voici le statut", response.new_statut);
            updatedDetail.statut = response.new_statut;
            updatedDetail.demandevalidesigne = response.file_path;
          }
        }

        // Mise à jour du groupe entier si upload global (par code_mouvement)
        if (this.selectedMouvementCode) {
          const groupIndex = this.filteredMouvementsGrouped.findIndex(
            g => g.code_mouvement === this.selectedMouvementCode
          );

          if (groupIndex !== -1) {
            const group = this.filteredMouvementsGrouped[groupIndex];

            // 1. Mise à jour de la propriété de fichier au niveau du groupe
            group.file_path = response.file_path;

            // 2. MISE À JOUR CRITIQUE : Créer un nouvel array 'details' mis à jour
            if (group.details && Array.isArray(group.details)) {
              // Créer une NOUVELLE liste de détails avec les statuts mis à jour
              group.details = group.details.map((detail: any) => ({
                ...detail, // Copie toutes les propriétés existantes
                statut: response.new_statut, // Force le nouveau statut
                demandevalidesigne: response.file_path, // Force le chemin du fichier
              }));
            }

            // 3. TECHNIQUE D'IMMUTABILITÉ pour forcer la détection de changement sur le groupe entier.
            // Angular détecte que l'objet 'group' a été modifié car 'group.details' a une nouvelle référence.
            this.filteredMouvementsGrouped[groupIndex] = { ...group };

            // 4. Force la détection de changement sur le tableau parent
            this.filteredMouvementsGrouped = [...this.filteredMouvementsGrouped];
          }
        }

        this.isProcessingAll = false;
        this.editvaliderDemande.reset();
        this.selectedFile = null;
        this.selectedId = null;
        this.selectedMouvementCode = null;

        const modal = document.getElementById('validerlademande');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal)
            || new (window as any).bootstrap.Modal(modal);
          bootstrapModal.hide();
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erreur d\'upload', error);
        this.isProcessingAll = false;
      }
    });
  }

  selectStatus(status: string) {
  this.selectedStatus = status;
  this.filterByStatus();
}

filterByStatus() {

  if (this.selectedStatus === 'Tous') {
    this.filteredMouvementsGrouped = this.mouvementsGrouped;
    return;
  }

  this.filteredMouvementsGrouped = this.mouvementsGrouped.filter(group =>
    group.details.some(detail => detail.statut === this.selectedStatus)
  );

}



  loadGroupedMouvements() {
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
        Swal.fire({
          title: 'Erreur',
          text: 'Erreur serveur ou réseau',
          icon: 'error',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#d33'
        });
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
      group.bureau.toLowerCase().includes(val) ||
      group.details.some(detail =>
        (detail.article?.libelle || '').toLowerCase().includes(val) ||
        (detail.description || '').toLowerCase().includes(val)
      )
    );
  }


  getStatutForm(detail: MouvementStock): void {
     this.selectedCodeMouvement = detail.code_mouvement ?? '';
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

          const qteControl = this.editStatutSortie.get('qte');
          
          qteControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(this.quantiteDisponible)
          ]);
          
          qteControl?.updateValueAndValidity();
          
          this.patchEditStatutSortieForm(detail);
        },
        (error: any) => {
          console.error('Erreur lors de la récupération de la quantité disponible pour statut:', error);
          this.quantiteDisponible = 0;
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de récupérer la quantité disponible pour cet article.',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
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

          // Cette partie du code a été supprimée
          // const pdfUrl = `${this.url}/mouvements/fiche/${id}`;
          // window.open(pdfUrl, '_blank');

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
                   
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier les informations de la demande et réessayer.';

                    if (error.status === 422) {
                      // Erreur de validation (ex: quantité insuffisante pour le nouveau statut)
                      detail = 'Erreur de Validation : Les données fournies sont incomplètes ou incorrectes (ex. quantité invalide, statut non autorisé).';
                     
                      // Tente d'extraire le message d'erreur du serveur s'il est plus précis
                      if (error.error && error.error.error) {
                        detail = `Erreur de Validation : ${error.error.error}`;
                      }
                    } else if (error.status === 404) {
                      // La demande à modifier n'existe plus
                      detail = 'La demande de stock à modifier est introuvable. Elle a peut-être été supprimée.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier le statut de cette demande.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Impossible de communiquer avec le serveur pour mettre à jour la demande.';
                    } else if (error.error && error.error.error) {
                      // S'il y a un message générique d'erreur dans le corps
                      detail = `Erreur Serveur: ${error.error.error}`;
                    } else if (error.error && error.error.message) {
                      // Parfois 'message' est utilisé au lieu de 'error'
                      detail = `Erreur Serveur: ${error.error.message}`;
                    }

                    // Message final clair
                    Swal.fire({
                      title: 'Erreur',
                      text: 'La modification du statut de la demande a échoué.\n\nDétails : ${detail}\n\nVeuillez contacter le support technique si le problème persiste.',
                      icon: 'error',
                      confirmButtonText: 'Réessayer',
                      confirmButtonColor: '#d33'
                    });
                  }
                });
    }


  onClickSubmitEditAllSortie() {
    if (this.isProcessingAll) {
      console.warn('Soumission "Tout Traiter" déjà en cours. Opération annulée.');
      return;
    }

    if (this.edit_all.invalid) {
      this.markFormGroupTouched(this.edit_all);
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    this.isProcessingAll = true;

    const formData = {
      ...this.edit_all.value,
      date_mouvement: this.formatDate(this.edit_all.value.date_mouvement),
    };

  this.mouvementService.validerDemandeGroupee(formData)
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (data: any) => {
        this.isProcessingAll = false;

        const modal = document.getElementById('tout_traiter');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        this.loadGroupedMouvements();
        this.edit_all.reset();

        setTimeout(() => {
          this.alertModifAllVisible = true;
          setTimeout(() => this.alertModifAllVisible = false, 2000);
        }, 200);
      },
      (error: any) => {
        this.isProcessingAll = false;

        // 🔥 Extraire le message le plus précis
        const messageBack = error.error?.errors?.[0]
                          || error.error?.message
                          || error.error?.error
                          || "Erreur inconnue du serveur";

        // ✅ 1. Fermer d'abord le premier modal s'il est encore ouvert
        const modalOuvert = document.getElementById('tout_traiter');
        const bsModalOuvert = bootstrap.Modal.getInstance(modalOuvert);
        bsModalOuvert?.hide();

        // ✅ 2. Insérer le message dans le modal d’erreur
        document.getElementById('messageErreurBack')!.innerText = messageBack;
        this.loadGroupedMouvements();
        // ✅ 3. Afficher le modal d’erreur (après un court délai pour laisser le 1er se fermer)
        setTimeout(() => {
          const modalErreur = document.getElementById('modalErreurBack');
          const bsModalErreur = new bootstrap.Modal(modalErreur);
          bsModalErreur.show();
        }, 300);
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

  isGroupTraitable(group: MouvementStockGrouped): boolean {
    return group.details?.some(detail => detail.statut !== 'Accordé');
  }

  isGroupCompletelyAccorded(group: any): boolean {
    if (!group.details || group.details.length === 0) return false;
    // On exclut les articles refusés du calcul :
    // le groupe est considéré "accordé" si tous les articles non-refusés sont "Accordé"
    // et qu'il y en a au moins un (évite le cas d'un groupe 100% refusé)
    const nonRefuses = group.details.filter((detail: any) => detail.statut !== 'Refusé');
    return nonRefuses.length > 0 && nonRefuses.every((detail: any) => detail.statut === 'Accordé');
  }

  // À ajouter dans les-demandes.component.ts
  //ici--
  
  hasArticleACloturer(demande: any): boolean {
    if (!demande.details || demande.details.length === 0) return false;
    // On affiche le bouton si au moins un article est 'Accordée'
    // (Peu importe si d'autres sont 'Refusée')
    return demande.details.some((detail: any) => detail.statut === 'Accordé');
  }

}