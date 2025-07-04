import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TransfertsService } from '../../../core/services/transfert/transfert.service';
import { Immobilisation, Bureau, Employe, Transfert } from '../../../core/services/interface/models'; // Supprimé TypeIntervention, Intervention car non utilisés ici
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms"; // Ajouté FormArray
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';


declare var bootstrap: any;

@Component({
  selector: 'app-transfert',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
    // FeatherIconDirective // Retiré le commentaire si vous l'utilisez réellement
  ],
  templateUrl: 'transfert.component.html'
})
export class TransfertComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddTransfert: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canExportTransfert: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canModifyTransfert: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canDeleteTransfert: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canViewTransfert: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux / En panne', 'Irréparable'];


  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  messageEnMagazin:string="";

  rows: Transfert[] = [];
  temp: Transfert[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addTransfert!: FormGroup;
  public editTransfert!: FormGroup;
  public deleteTransfert!: FormGroup;

  immobilisations: Immobilisation[] = []; // Liste des immos
  bureaux: Bureau[] = []; // Liste des Bureaux,
  employes: Employe[] = []; // Liste des Employes,
  magasinId: number | null = null;

  // NOUVELLE PROPRIÉTÉ POUR GÉRER L'ÉTAT DE SOUMISSION
  isAddingTransfert: boolean = false; // Pour l'ajout d'un transfert

  @ViewChild('table') table!: DatatableComponent;

  constructor(private transfertService: TransfertsService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadImmobilisations();
      this.loadEmployes();
      this.loadBureaux();
      this.loadTransferts();
    }


    this.addTransfert = this.formBuilder.group({
      immo_id: [null, [Validators.required]],
      old_bureau_id: [null], // Défini sur null pour les champs non requis initialement
      old_employe_id: [null], // Défini sur null pour les champs non requis initialement
      bureau_id: [null, [Validators.required]],
      employe_id: [null, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      observation: ["", []],
      etat: [null],
      date_mise_en_service: [null]
    });

    this.addTransfert.get('old_bureau_id')?.valueChanges.subscribe(() => this.updateMiseEnServiceField());
    this.addTransfert.get('old_employe_id')?.valueChanges.subscribe(() => this.updateMiseEnServiceField());


    // Dynamique : gestion conditionnelle des champs
    this.addTransfert.get('bureau_id')?.valueChanges.subscribe((bureauId) => {
      const etatControl = this.addTransfert.get('etat');
      const employeControl = this.addTransfert.get('employe_id');

      if (bureauId === this.magasinId) {
        etatControl?.setValidators([Validators.required]);
        employeControl?.clearValidators();
        employeControl?.setValue(null);
      } else {
        etatControl?.clearValidators();
        etatControl?.setValue(null);
        employeControl?.setValidators([Validators.required]);
      }

      etatControl?.updateValueAndValidity();
      employeControl?.updateValueAndValidity();
    });

    this.editTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
      immo_id: [null, [Validators.required]],
      old_bureau_id: [null, []],
      old_employe_id: [null, []],
      bureau_id: [null, [Validators.required]],
      employe_id: [null, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      observation: ["", []],
    });
    this.deleteTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  updateMiseEnServiceField(): void {
    const oldBureau = this.addTransfert.get('old_bureau_id')?.value;
    const oldEmploye = this.addTransfert.get('old_employe_id')?.value;
    const miseServiceControl = this.addTransfert.get('date_mise_en_service');

    if (!oldBureau && !oldEmploye) {
      // Mise en service initiale
      miseServiceControl?.setValidators([Validators.required]);
    } else {
      miseServiceControl?.clearValidators();
      miseServiceControl?.setValue(null);
    }

    miseServiceControl?.updateValueAndValidity();
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
      this.canAddTransfert = allowedFonctionnalites.includes('Ajout immobilisation');
      this.canExportTransfert = allowedFonctionnalites.includes('Exporter immobilisation');
      this.canViewTransfert = allowedFonctionnalites.includes('Voir les Transferts');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewTransfert;

      console.log('🔐 Permissions calculées:', {
        canAddTransfert: this.canAddTransfert,
        canExportTransfert: this.canExportTransfert,
        canModifyTransfert: this.canModifyTransfert,
        canDeleteTransfert: this.canDeleteTransfert,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la gestion des immobilisations');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  // onClickSubmitAddTransfert() {

  //   if (!this.canAddTransfert) {
  //     alert('Vous n\'avez pas l\'autorisation d\'effectuer un transfert.');
  //     return;
  //   }

  //   console.log('onClickSubmitAddTransfert appelé. isAddingTransfert:', this.isAddingTransfert);

  //   // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
  //   if (this.isAddingTransfert) {
  //     console.warn('Soumission multiple détectée pour Transfert. Annulation.');
  //     return; // Empêche l'exécution si déjà en cours
  //   }

  //   const spinner = document.querySelector('.spinner-add-transfert'); // Assurez-vous que ce sélecteur correspond à votre HTML

  //   if (this.addTransfert.valid) {
  //     this.isAddingTransfert = true; // Désactiver le bouton
  //     console.log('isAddingTransfert mis à true.');

  //     if (spinner) {
  //       spinner.classList.remove('d-none');
  //       console.log('Spinner Transfert affiché.');
  //     }

  //     const formData = {
  //       ...this.addTransfert.value,
  //       date_mouvement: this.formatDate(this.addTransfert.value.date_mouvement), // Convertir la date
  //     };
  //     this.transfertService.saveTransfert(formData).subscribe(
  //       (data: any) => {
  //         this.loadTransferts();
  //         if (spinner) spinner.classList.add('d-none');
  //         this.addTransfert.reset();
  //         this.isAddingTransfert = false; // Réactiver le bouton
  //         console.log('Soumission Transfert réussie. isAddingTransfert mis à false.');

  //         // Fermer le modal manuellement
  //         const modal = document.getElementById('add_transfert');
  //         // @ts-ignore - pour éviter les erreurs TypeScript
  //         const bsModal = bootstrap.Modal.getInstance(modal);
  //         bsModal?.hide();

  //         // Attendre que le modal soit fermé avant d'afficher l'alerte
  //         setTimeout(() => {
  //           this.alertAjoutVisible = true;
  //           console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

  //           // Utilisation de la transition pour faire apparaitre l'alerte
  //           setTimeout(() => {
  //             this.alertAjoutVisible = false;
  //           }, 2000); // L'alerte disparaît après 2 secondes
  //         }, 200); // L'alerte apparaît 200ms après la fermeture du modal
  //       },
  //       (error: any) => {
  //         console.error('Erreur lors de l\'ajout du transfert :', error);
  //         if (spinner) spinner.classList.add('d-none');
  //         this.isAddingTransfert = false; // Réactiver le bouton en cas d'erreur
  //         console.error('Soumission Transfert échouée. isAddingTransfert mis à false.');
  //         alert('Une erreur s\'est produite. Veuillez réessayer.');
  //       }
  //     );
  //   } else {
  //     if (spinner) spinner.classList.add('d-none');
  //     this.markFormGroupTouched(this.addTransfert); // Marquer les champs comme touchés pour afficher les erreurs
  //     alert("Désolé, le formulaire n'est pas bien renseigné");
  //     console.log('Formulaire Transfert invalide.');
  //   }
  // }

  // Marquer tous les champs comme touchés
  // markFormGroupTouched(formGroup: FormGroup) {
  //   Object.values(formGroup.controls).forEach(control => {
  //     control.markAsTouched();
  //   });
  // }

  onClickSubmitAddTransfert() {
    if (this.isAddingTransfert) {
      console.warn('Soumission en cours. Annulé.');
      return;
    }

    const spinner = document.querySelector('.spinner-add-transfert');

    if (this.addTransfert.valid) {
      this.isAddingTransfert = true;
      if (spinner) spinner.classList.remove('d-none');

      const formData = {
        ...this.addTransfert.value,
        date_mouvement: this.formatDate(this.addTransfert.value.date_mouvement),
        date_mise_en_service: this.addTransfert.value.date_mise_en_service
          ? this.formatDate(this.addTransfert.value.date_mise_en_service)
          : null,
      };

      this.transfertService.saveTransfert(formData).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.addTransfert.reset();
          this.isAddingTransfert = false;

          // Fermer le modal manuellement
          const modal = document.getElementById('add_transfert');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          if (spinner) spinner.classList.add('d-none');
          this.isAddingTransfert = false;
          alert("Erreur lors de l'enregistrement.");
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addTransfert);
      alert("Formulaire invalide.");
    }
  }

  onClickSubmitEditTransfert() {

    if (!this.canModifyTransfert) {
      alert('Vous n\'avez pas l\'autorisation de mettre à jour une affectation.');
      return;
    }


    console.log(this.editTransfert.value);
    const spinner = document.querySelector('.spinnerModif');

    // NOTE: Il serait bon d'avoir une propriété isEditingTransfert: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isEditingTransfert = true; // Ajoutez ceci
    if (this.editTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editTransfert.value.id;
      // Convertir la date pour l'édition également
      const formData = {
        ...this.editTransfert.value,
        date_mouvement: this.formatDate(this.editTransfert.value.date_mouvement),
      };
      this.transfertService.editTransfert(formData).subscribe( // Utiliser formData ici
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.editTransfert.reset();
          // this.isEditingTransfert = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_transfert');
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
          console.error('Erreur lors de la modification du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isEditingTransfert = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteTransfert() {

    if (!this.canDeleteTransfert) {
      alert('Vous n\'avez pas l\'autorisation de supprimer cette affectation.');
      return;
    }
    console.log(this.deleteTransfert.value);
    const spinner = document.querySelector('.spinnerDelete');

    // NOTE: Il serait bon d'avoir une propriété isDeletingTransfert: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isDeletingTransfert = true; // Ajoutez ceci
    if (this.deleteTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.transfertService.deleteTransfert(this.deleteTransfert.value).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.deleteTransfert.reset();
          // this.isDeletingTransfert = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_transfert');
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
          console.error('Erreur lors de la supression du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isDeletingTransfert = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
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

  loadTransferts(): void {
    this.transfertService.getAllTransferts().subscribe(
      (data: Transfert[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Transferts', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(transfert =>
      (transfert.date_mouvement.toLowerCase().includes(val)) || // Filtrer par date
      (transfert.immobilisation && transfert.immobilisation.designation.toLowerCase().includes(val)) || // Filtrer par désignation de l'immo
      (transfert.bureau && transfert.bureau.libelle_bureau.toLowerCase().includes(val)) || // Filtrer par nouveau bureau
      (transfert.observation?.toLowerCase().includes(val)) ||
      (transfert.employe && (transfert.employe.nom ).toLowerCase().includes(val))
    );

    this.table.offset = 0;
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(transfert =>
  //     transfert.date_mouvement.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }

  getEditForm(row: any) {
    this.editTransfert.patchValue({
      id: row.id,
      immo_id: row.immo_id,
      old_bureau_id: row.old_bureau_id, // Peut-être que vous voulez afficher le libellé ici, pas seulement l'ID
      old_employe_id: row.old_employe_id, // Idem
      bureau_id: row.bureau_id,
      employe_id: row.employe_id,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
      observation: row.observation,
    })
  }

  getDeleteForm(row: any) {
    this.deleteTransfert.patchValue({
      id: row.id,
    })
  }

  loadImmobilisations(): void {
    this.transfertService.getAllImmobilisations().subscribe({
      next: (data) => {
        this.immobilisations = data; // Stocker la liste des immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }
  loadEmployes(): void {
    this.transfertService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data; // Stocker la liste des Employés
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }
  loadBureaux(): void {
    this.transfertService.getAllBureaux().subscribe({
      next: (data) => {
        this.bureaux = data; // Stocker la liste des bureaux
        const magasin = this.bureaux.find(b => b.libelle_bureau?.toLowerCase() === 'magasin');
        this.magasinId = magasin?.id ?? null;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }

  updateOldInfo() {
    const idImmo = this.addTransfert.get('immo_id')?.value;
    console.log('ID de l\'IMMO sélectionné:', idImmo);
    if (!idImmo) {
      console.log('Aucun article sélectionné ou désélection effectuée');
      // Réinitialiser les champs old_bureau_id et old_employe_id si l'immo est désélectionnée
      this.addTransfert.patchValue({
        old_bureau_id: null,
        old_employe_id: null
      });
      return;
    }
    this.transfertService.getOldInfo(idImmo).subscribe(
      (response) => {
        console.log('Info Récupérée:', response);
        if (response.bureau==null && response.employe==null) {
          this.messageEnMagazin="Cette Immo est actuellement en magasin"
        }
        this.addTransfert.patchValue({
          old_bureau_id: response.bureau, // Assurez-vous que 'bureau' dans response est l'ID du bureau
          old_employe_id: response.employe // Assurez-vous que 'employe' dans response est l'ID de l'employé
        });
      },
      (error) => {
        console.error('Erreur lors des Infos:', error);
        // En cas d'erreur, réinitialiser ou gérer l'état
        this.addTransfert.patchValue({
          old_bureau_id: null,
          old_employe_id: null
        });
        alert("Impossible de récupérer les anciennes informations pour cette immobilisation.");
      }
    );
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format CCYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer CCYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  downloadTransfertsPDF(): void {

    if (!this.canExportTransfert) {
      alert('Vous n\'avez pas l\'autorisation d\'exportr la liste des transferts.');
      return;
    }


    this.transfertService.imprimerTransferts().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_transferts.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des transferts:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }
}
