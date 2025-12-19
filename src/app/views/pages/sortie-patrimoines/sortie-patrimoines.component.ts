import { Component, ViewChild, OnInit,ViewEncapsulation, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { Categorie, Article,SortiePatrimoine, ImportReport, ImportError } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,FormArray, AbstractControl  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgbDateStruct, NgbCalendar, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { ImmobilisationsService } from '../../../core/services/enregistrement-immos/enregistrement-immos.service';
declare var bootstrap: any;
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  Immobilisation, Bureau, Employe, Fournisseur,
  GroupeTypeImmo, SousTypeImmo, StatusImmo, Vehicule, PaginatedResponse, Transfert, 
  Intervention, TypeIntervention, CodeAsset, BackendPostResource
} from '../../../core/services/interface/models';
import { Subject, takeUntil } from 'rxjs';
import { map, distinct } from 'rxjs/operators';
import { ActifCode } from '../../../core/services/interface/models';
import { SortiePatrimoineService } from '../../../core/services/sortie-patrimoine/sortie-patrimoine.service';


interface CodesApiResponse {
  success: boolean;
  message: string;
  data: {
    codes: ActifCode[]; 
  };
}

@Component({
  selector: 'sortie-patrimoines',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    NgSelectModule,
    NgbModule,
  ],
  templateUrl: 'sortie-patrimoines.component.html',
  styleUrls: ['sortie-patrimoines.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SortiePatrimoinesComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: SortiePatrimoine[] = [];
  temp: SortiePatrimoine[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  importReport: ImportReport | null = null;
  importError: ImportError | null = null;

  immobilisationCodes: string[] = [];

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp
  alertImportVisible: boolean = false; // Nouvelle alerte pour l'import

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addSortiePatrimoine!: FormGroup ;
  public editSortiePatrimoine!: FormGroup ;
  public deleteSortiePatrimoine!: FormGroup ;
  isImporting: boolean = false; // Nouvelle propriété pour l'état d'importation
  selectedFile: File | null = null; // Pour stocker le fichier sélectionné

  public toastVisible: boolean = false;
  public toastType: 'success' | 'danger' | 'warning' | 'black' = 'success'; // Type d'alerte Bootstrap
  public toastTitle: string = '';
  public toastMessage: string = '';
  public ignoredLines: string[] = []; // Pour stocker les lignes ignorées

  @ViewChild('table') table!: DatatableComponent;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();


  constructor(
    private sortiePatrimoineService: SortiePatrimoineService,
    private formBuilder: FormBuilder,
    private router: Router,
    private immobilisationsService: ImmobilisationsService,
  ) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadSortiePatrimoines();
      this.loadImmobilisationCodes();
      this.initForm();
    }

    this.editSortiePatrimoine = this.formBuilder.group({
        id: [0, [Validators.required]],
        code_immo: ["", [Validators.required, Validators.maxLength(50)]], 
        designation_immo: ["", [Validators.required, Validators.maxLength(50)]],
        type_immo: ["", [Validators.required, Validators.maxLength(50)]],      
        valeur: ["", [Validators.required, Validators.min(0)]], 
        date_sortie: ["", [Validators.required]], 
        observation: [null], 
    });

    // Formulaire pour la SUPPRESSION LOGIQUE d'une SortiePatrimoine
    this.deleteSortiePatrimoine = this.formBuilder.group({
        id: [0, [Validators.required]],
    });
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
      this.canVoirParamStock = allowedFonctionnalites.includes('Voir Parametres Stock');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamStock;

      console.log('🔐 Permissions calculées:', {
        canVoirParamStock: this.canVoirParamStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }


  initForm(): void {
    this.addSortiePatrimoine = this.formBuilder.group({
      sortiepatrimoines: this.formBuilder.array([this.createSortiePatrimoineFormGroup()])
    });
  }
  // Getter pour accéder facilement au FormArray
get sortiepatrimoinesArray(): FormArray<FormGroup> {
    // Si votre FormArray contient des FormGroup, utilisez ce type pour clarifier
    return this.addSortiePatrimoine.get('sortiepatrimoines') as FormArray<FormGroup>; 
}
  // Méthode pour créer un groupe de formulaire pour un seul article
createSortiePatrimoineFormGroup(): FormGroup {
    return this.formBuilder.group({
        code_immo: ["", [Validators.required, Validators.maxLength(50)]], 
        designation_immo: ["", [Validators.required, Validators.maxLength(50)]], // Changé
        type_immo: ["", [Validators.required, Validators.maxLength(50)]],       // Ajouté
        valeur: [0, [Validators.required, Validators.min(0)]],                 // Changé et type 'number'
        date_sortie: ["", [Validators.required]],                              // Changé
        observation: [null], 
    });
}

  // Ajouter un nouveau groupe d'article
  addNewSortiePatrimoine(): void {
    this.sortiepatrimoinesArray.push(this.createSortiePatrimoineFormGroup());
  }
  // Supprimer un article
  removeSortiePatrimoine(index: number): void {
    if (this.sortiepatrimoinesArray.length > 1) {
      this.sortiepatrimoinesArray.removeAt(index);
    }
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

onClickSubmitAddSortiePatrimoines(): void {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de sortie patrimoines déjà en cours. Opération annulée.');
      return;
    }

    // [Ligne supprimée] : console.log(this.addSortiePatrimoine.value); 
console.log('Valeurs du formulaire :', this.addSortiePatrimoine.value);
    // 2. Valider le formulaire
    if (this.addSortiePatrimoine.invalid) {
      this.markFormGroupTouched(this.addSortiePatrimoine); 
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;

    // --- LOGIQUE DE TRANSFORMATION DE LA DATE (SÛRE) ---

    const rawSorties = this.sortiepatrimoinesArray.value;

    const sortiesToSubmit = rawSorties.map((sortie: any) => {
        let formattedDate: string | null = null;

        if (sortie.date_sortie && typeof sortie.date_sortie === 'object') {
            formattedDate = this.formatNgbDate(sortie.date_sortie);
        }

        return {
            ...sortie, 
            date_sortie: formattedDate // Date au format 'YYYY-MM-DD'
        };
    });
    
    // Pour débogage : VÉRIFICATION DU FORMAT FINAL
    console.log('Sorties prêtes pour l\'API (Date formatée):', sortiesToSubmit); 

    // --- FIN DE LA CORRECTION ---
    
    // 4. ENVOI DU TABLEAU TRANSFORME
    this.sortiePatrimoineService.saveMultipleSorties(sortiesToSubmit).subscribe({ 
      next: (data: any) => {
        this.loadSortiePatrimoines();
        this.initForm(); // Réinitialiser le formulaire
        
        // Fermer le modal
        const modal = document.getElementById('add_sortie_patrimoine'); 
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Affichage de l'alerte de succès
        setTimeout(() => {
          this.alertAjoutVisible = true;
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); 
        }, 200); 
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout des sortie patrimoines :', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur s\'est produite. vérifiez si ce code n\'existe pas déjà. Veuillez réessayer.',
          icon: 'error',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#d33'
        });
      },
      complete: () => {
        // 5. Désactiver l'indicateur de chargement
        this.isAdding = false;
      }
    });
}

onClickSubmitEditSortiePatrimoine(){
  if (this.isEditing) return;

  if (this.editSortiePatrimoine.invalid) {
    this.markFormGroupTouched(this.editSortiePatrimoine);
    Swal.fire({
      title: 'Erreur',
      text: 'Désolé, le formulaire n\'est pas bien renseigné',
      icon: 'error',
      confirmButtonText: 'Réessayer',
      confirmButtonColor: '#d33'
    });
    return;
  }

  this.isEditing = true;

  // --- Conversion de la date ---
  const rawValue = this.editSortiePatrimoine.value;
  const dateObj = rawValue.date_sortie;

  let formattedDate = null;
  if (dateObj && typeof dateObj === 'object') {
    const month = dateObj.month.toString().padStart(2, '0');
    const day = dateObj.day.toString().padStart(2, '0');
    formattedDate = `${dateObj.year}-${month}-${day}`;
  }

  const payload = {
    ...rawValue,
    date_sortie: formattedDate // <-- conversion au format attendu
  };

  this.sortiePatrimoineService.editSortiePatrimoine(payload).subscribe({
    next: (data: any) => {
      this.loadSortiePatrimoines();
      this.editSortiePatrimoine.reset();
      const modal = document.getElementById('edit_sortie_patrimoine');
      // @ts-ignore
      const bsModal = bootstrap.Modal.getInstance(modal);
      bsModal?.hide();
      setTimeout(() => {
        this.alertModifVisible = true;
        setTimeout(() => this.alertModifVisible = false, 2000);
      }, 200);
    },
    error: (error: any) => {
      console.error('Erreur lors de la modification :', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Une erreur s\'est produite. Veuillez réessayer.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    },
    complete: () => this.isEditing = false
  });
}


onClickSubmitDeleteSortiePatrimoine(): void {
  // 1. Vérifier si une suppression est déjà en cours
  if (this.isDeleting) {
    console.warn('Suppression de la sortie patrimoine déjà en cours. Opération annulée.');
    return;
  }

  // 2. Valider le formulaire
  if (this.deleteSortiePatrimoine.invalid) {
    this.markFormGroupTouched(this.deleteSortiePatrimoine);
    Swal.fire({
      title: 'Erreur',
      text: 'Désolé, le formulaire n\'est pas bien renseigné',
      icon: 'error',
      confirmButtonText: 'Réessayer',
      confirmButtonColor: '#d33'
    });
    return;
  }

  // 3. Activer l'indicateur de chargement
  this.isDeleting = true;

  // Récupérer uniquement l'ID
  const id = this.deleteSortiePatrimoine.value.id;

  this.sortiePatrimoineService.deleteSortiePatrimoine(id).subscribe({
    next: () => {
      // Recharger les données après suppression
      this.loadSortiePatrimoine();

      // Réinitialiser le formulaire
      this.deleteSortiePatrimoine.reset();

      // Fermer le modal
const modal = document.getElementById('delete_sortie_patrimoine'); // correspond à l'ID exact
const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
bsModal.hide();

      // Afficher l'alerte de succès
      this.alertSuppVisible = true;
      setTimeout(() => this.alertSuppVisible = false, 2000);
    },
    error: (error: any) => {
      console.error('Erreur lors de la suppression de la sortie patrimoine :', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Une erreur s\'est produite. Veuillez réessayer.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    },
    complete: () => {
      // Désactiver l'indicateur de chargement
      this.isDeleting = false;
    }
  });
}



loadSortiePatrimoine(): void {
    this.sortiePatrimoineService.getAllSortiePatrimoines().subscribe(
      (data: SortiePatrimoine[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des sortie de patrimoine', error);
        this.loadingIndicator = false;
      }
    );
  }


updateFilter(event: KeyboardEvent): void {
  // Récupérer la valeur de recherche en minuscules
  const val = (event.target as HTMLInputElement).value.toLowerCase();

  this.rows = this.temp.filter((sortie: SortiePatrimoine) =>

    (sortie.code_immo && sortie.code_immo.toLowerCase().includes(val)) ||

    (sortie.designation_immo && sortie.designation_immo.toLowerCase().includes(val)) || // Correspond à l'ancien 'libelle'

    (sortie.type_immo && sortie.type_immo.toLowerCase().includes(val)) ||

    (sortie.valeur !== undefined && String(sortie.valeur).toLowerCase().includes(val)) ||

    (sortie.date_sortie && sortie.date_sortie.toLowerCase().includes(val)) || 

    (sortie.observation && String(sortie.observation).toLowerCase().includes(val)) // Correspond à l'ancienne 'description'
  );

  this.table.offset = 0;
}

getEditForm(row: SortiePatrimoine): void {
  const [year, month, day] = row.date_sortie.split('-').map(Number);

  this.editSortiePatrimoine.patchValue({
      id: row.id, 
      code_immo: row.code_immo,
      designation_immo: row.designation_immo, 
      type_immo: row.type_immo,              
      valeur: row.valeur,               
      date_sortie: { year, month, day }, // <-- conversion obligatoire
      observation: row.observation, 
  });
}

  getDeleteForm(row: any){
    this.deleteSortiePatrimoine.patchValue({
     id:row.id,
    })
  }

/**
   * Gère la sélection du fichier Excel par l'utilisateur.
   * @param event L'événement de changement du champ input de type 'file'.
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Fichier sélectionné:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
    }
  }

  /**
   * Envoie le fichier Excel sélectionné au backend pour importation.
   */
    uploadExcelFile(): void {
    // ⚠️ On retire la fonction locale showNotification ⚠️

    if (!this.selectedFile) {
        // Utilisation du Toast pour l'alerte
        const modal = document.getElementById('importSortiePatrimoinesExcel');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();
        this.showToast('warning', 'Sélection de Fichier', 'Veuillez sélectionner un fichier Excel à importer.');
        return;
    }

    this.isImporting = true;
    this.importReport = null;
    this.importError = null;

    const spinner = document.querySelector('.spinner-import-article');
    if (spinner) {
        spinner.classList.remove('d-none');
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.sortiePatrimoineService.importSortiePatrimoine(formData).subscribe({
        next: (response: any) => {
            console.log('Importation réussie:', response);
            this.loadSortiePatrimoines();

            this.isImporting = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }

            // Fermer le modal d'importation
            const modal = document.getElementById('importSortiePatrimoinesExcel');
            if (typeof bootstrap !== 'undefined' && modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal?.hide();
            }

            // Stocker le rapport (optionnel, mais bien pour le debug)
            this.importReport = {
                message: response.message,
                success_count: response.success_count,
                total_rows_processed: response.total_rows_processed,
                ignored: response.ignored || []
            };

            // ✅ GESTION DU SUCCÈS OU SUCCÈS PARTIEL avec this.showToast()
            if (this.importReport.ignored.length > 0) {
                this.ignoredLines = this.importReport.ignored; // Stocke les lignes pour l'affichage HTML du toast
                this.showToast(
                    'warning', // Type : Avertissement (jaune/orange)
                    'Importation Partielle',
                    response.message + '. Veuillez consulter les lignes ignorées.'
                );
            } else {
                this.ignoredLines = []; // Aucune ligne ignorée
                this.showToast(
                    'success', // Type : Succès (vert)
                    'Importation Réussie !',
                    response.message || 'Tous les articles ont été importés avec succès.'
                );
            }

            this.selectedFile = null;
            const fileInput = document.getElementById('excelFile') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = ''; // important pour pouvoir re-sélectionner le même fichier
            }
        },
        error: (error) => {
            console.error('Erreur lors de l\'importation des articles:', error);

            this.isImporting = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }

            // GESTION DE L'ERREUR avec this.showToast()
            let errorMessage = 'Une erreur est survenue lors de l\'importation. Veuillez vérifier le fichier et réessayer.';
            let errorTitle = 'Erreur Générale';


            if (error.error) {
                if (error.error.errors) {
                    // Erreur de validation (422)
                    let validationErrors = [];
                    for (const key in error.error.errors) {
                        if (error.error.errors.hasOwnProperty(key)) {
                            validationErrors.push(error.error.errors[key].join(', '));
                        }
                    }
                    errorMessage = 'Le fichier contient des erreurs de validation : ' + validationErrors.join('; ');
                    errorTitle = 'Erreur de Validation (422)';
                } else if (error.error.message) {
                    // Erreur critique (500)
                    errorMessage = error.error.message + (error.error.error ? ` Détails: ${error.error.error}` : '');
                    errorTitle = 'Erreur Critique du Serveur';
                }
            }

            // Utilisation du Toast pour l'erreur
            this.ignoredLines = []; // Pas de lignes ignorées à afficher en cas d'erreur totale
            this.showToast('danger', errorTitle, errorMessage);
        }
    });
}

  showToast(type: 'success' | 'danger' | 'warning' | 'black', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;

    // Masquer le toast automatiquement après 5 secondes
    setTimeout(() => {
      this.toastVisible = false;
      this.ignoredLines = [];
    }, 60000);
  }

  loadImmobilisationCodes(): void {
    console.log('Loading immobilisation codes...');
    
    this.immobilisationsService.getAllCode_vehiculeImmo().pipe(
      map((codeAssets: CodeAsset[]) => {
          
        console.log('1. Codes bruts reçus du service (CodeAsset[]):', codeAssets); // DIAG 1
          
        if (!codeAssets || !Array.isArray(codeAssets)) {
            console.warn("L'API n'a pas retourné de tableau de codes valide.");
            return [];
        }
        
        // 1. Extraire la propriété 'code' de chaque objet CodeAsset
        const codesArray = codeAssets.map((asset: CodeAsset) => asset.code);
        
        console.log('2. Codes extraits avant unicité (string[]):', codesArray); // DIAG 2
        
        // 2. Utiliser un Set pour garantir l'unicité des codes (sans doublons)
        const uniqueCodes = [...new Set(codesArray)];
        
        console.log('3. Codes uniques après Set:', uniqueCodes); // DIAG 3
        
        return uniqueCodes;
      }),
      takeUntil(this.destroy$)
    ).subscribe(
      (codes: string[]) => {
        
        console.log('4. Codes reçus par le Subscriber (avant filtre):', codes); // DIAG 4
          
        // Filtrage des codes vides/nulls
        this.immobilisationCodes = codes.filter(code => code !== null && code !== undefined && code !== '');
        
        console.log('Codes d\'immobilisation chargés (pour rapport d\'enregistrement):', this.immobilisationCodes.length, 'codes.');
      },
      (error) => {
        console.error('Erreur lors du chargement des codes d\'immobilisation:', error);
      }
    );
}

loadSortiePatrimoines(): void {
    this.sortiePatrimoineService.getAllSortiePatrimoines().subscribe(
      (data: SortiePatrimoine[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des SortiePatrimoines', error);
        this.loadingIndicator = false;
      }
    );
  }

/* onCodeChange(selectedValue: any, formGroup: AbstractControl): void {
    const currentFormGroup = formGroup as FormGroup;
    
    // Réinitialiser la désignation en cas d'erreur ou de désélection
    currentFormGroup.patchValue({ designation_immo: null });

    // Vérifier si une valeur a été sélectionnée (code ou ID)
    if (selectedValue) {
        // Dans le cas où bindValue est absent ou mal configuré (renvoie le code)
        const codeToSearch = typeof selectedValue === 'string' ? selectedValue : 'ERREUR_CODE'; 

        // Appel au service pour récupérer la désignation
        this.immobilisationsService.getDesignationByCode(codeToSearch).subscribe({
            next: (response: any) => {
                // --- CORRECTION CLÉ : AJOUT DU 'e' FINAL ---
                const designation = response.data?.designation_complete || 'Désignation non trouvée';
                // ------------------------------------------
                
                console.log(`Désignation reçue pour ${codeToSearch}:`, designation);
                
                currentFormGroup.patchValue({
                    designation_immo: designation
                });
            },
            error: (err) => {
                console.error(`Erreur lors de la récupération de la désignation pour ${codeToSearch}:`, err);
                currentFormGroup.patchValue({
                    designation_immo: 'ERREUR - Voir console'
                });
            }
        });

    }
} */

    onCodeChange(selectedValue: any, formGroup: AbstractControl): void {
  const currentFormGroup = formGroup as FormGroup;
  currentFormGroup.patchValue({ designation_immo: null, type_immo: null });

  if (selectedValue) {
    const codeToSearch = typeof selectedValue === 'string' ? selectedValue : 'ERREUR_CODE';

    this.immobilisationsService.getDesignationByCode(codeToSearch).subscribe({
      next: (response: any) => {
        const designation = response.data?.designation_complete || 'Désignation non trouvée';
        const type = response.data?.type || 'Type inconnu'; // ✅ AJOUT ICI

        currentFormGroup.patchValue({
          designation_immo: designation,
          type_immo: type // ✅ Remplissage auto
        });
      },
      error: (err) => {
        console.error(`Erreur lors de la récupération de la désignation pour ${codeToSearch}:`, err);
        currentFormGroup.patchValue({
          designation_immo: 'ERREUR - Voir console',
          type_immo: null
        });
      }
    });
  }
}


private formatNgbDate(dateObj: NgbDateStruct): string | null {
    if (!dateObj) {
        return null;
    }
    
    const year = dateObj.year;
    // Ajoute un zéro si le mois est < 10 (ex: 1 devient 01)
    const month = String(dateObj.month).padStart(2, '0'); 
    // Ajoute un zéro si le jour est < 10 (ex: 5 devient 05)
    const day = String(dateObj.day).padStart(2, '0');
    
    // Le résultat est bien YYYY-MM-DD, comme souhaité
    return `${year}-${month}-${day}`; 
}

 } 
