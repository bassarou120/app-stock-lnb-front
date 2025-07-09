import { Component, ViewChild, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TransfertsService } from '../../../core/services/transfert/transfert.service';
import { Immobilisation, Bureau, Employe, Transfert } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


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
    FeatherIconDirective
  ],
  templateUrl: 'transfert.component.html'
})
export class TransfertComponent implements OnInit, OnDestroy {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddTransfert: boolean = true;
  canExportTransfert: boolean = true;
  canModifyTransfert: boolean = true;
  canDeleteTransfert: boolean = true;
  canViewTransfert: boolean = true;

  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux / En panne', 'Irréparable'];

  hasPageAccess: boolean = true;

  messageEnMagazin: string = "";

  rows: Transfert[] = [];
  temp: Transfert[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addTransfert!: FormGroup;
  public editTransfert!: FormGroup;
  public deleteTransfert!: FormGroup;

  immobilisations: Immobilisation[] = [];
  bureaux: Bureau[] = [];
  employes: Employe[] = [];
  magasinId: number | null = null;

  isAddingTransfert: boolean = false;

  // Nouvelle propriété pour contrôler l'affichage du champ État
  showEtatField: boolean = false;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private transfertService: TransfertsService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.initializePermissions();

    if (this.hasPageAccess) {
      this.loadImmobilisations();
      this.loadEmployes();
      this.loadBureaux(); 
      this.loadTransferts();
    }

    this.addTransfert = this.formBuilder.group({
      immo_id: [null, [Validators.required]],
      old_bureau_id: [null, []],
      old_employe_id: [null, []],
      bureau_id: [null, [Validators.required]],
      employe_id: [null, []],
      date_mouvement: [null, [Validators.required]],
      observation: ["", []],
      etat: [null, []], 
      date_mise_en_service: [null, []]
    });

    this.editTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
      immo_id: [null, [Validators.required]],
      old_bureau_id: [null, []],
      old_employe_id: [null, []],
      bureau_id: [null, [Validators.required]],
      employe_id: [null, []],
      date_mouvement: [null, [Validators.required]],
      observation: ["", []],
      etat: [null, []],
      date_mise_en_service: [null, []]
    });
    this.deleteTransfert = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return;
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      this.canAddTransfert = allowedFonctionnalites.includes('Ajout immobilisation');
      this.canExportTransfert = allowedFonctionnalites.includes('Exporter immobilisation');
      this.canViewTransfert = allowedFonctionnalites.includes('Voir les Transferts');
      this.canModifyTransfert = allowedFonctionnalites.includes('Modification immobilisation');
      this.canDeleteTransfert = allowedFonctionnalites.includes('Suppression immobilisation');


      this.hasPageAccess = this.canViewTransfert;

      console.log('🔐 Permissions calculées:', {
        canAddTransfert: this.canAddTransfert,
        canExportTransfert: this.canExportTransfert,
        canModifyTransfert: this.canModifyTransfert,
        canDeleteTransfert: this.canDeleteTransfert,
        hasPageAccess: this.hasPageAccess
      });

      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la gestion des immobilisations');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
    }
  }

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
          this.showEtatField = false;
          this.addTransfert.get('etat')?.clearValidators();
          this.addTransfert.get('etat')?.updateValueAndValidity();


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
          alert("Erreur lors de l'enregistrement: " + (error.error?.message || error.message));
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addTransfert);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
    }
  }

  onClickSubmitEditTransfert() {
    if (!this.canModifyTransfert) {
      alert('Vous n\'avez pas l\'autorisation de mettre à jour une affectation.');
      return;
    }

    console.log(this.editTransfert.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.editTransfert.value,
        date_mouvement: this.formatNgbDateToYYYYMMDD(this.editTransfert.value.date_mouvement),
        date_mise_en_service: this.editTransfert.value.date_mise_en_service
          ? this.formatNgbDateToYYYYMMDD(this.editTransfert.value.date_mise_en_service)
          : null,
      };
      this.transfertService.editTransfert(formData).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.editTransfert.reset();

          const modal = document.getElementById('edit_transfert');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la modification du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer. ' + (error.error?.message || ''));
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.editTransfert);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
    }
  }

  onClickSubmitDeleteTransfert() {
    if (!this.canDeleteTransfert) {
      alert('Vous n\'avez pas l\'autorisation de supprimer cette affectation.');
      return;
    }
    console.log(this.deleteTransfert.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteTransfert.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.transfertService.deleteTransfert(this.deleteTransfert.value).subscribe(
        (data: any) => {
          this.loadTransferts();
          if (spinner) spinner.classList.add('d-none');
          this.deleteTransfert.reset();

          const modal = document.getElementById('delete_transfert');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la suppression du transfert :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer. ' + (error.error?.message || ''));
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.deleteTransfert);
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

  loadTransferts(): void {
    this.transfertService.getAllTransferts().subscribe(
      (data: Transfert[]) => {
        this.temp = [...data];
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


  getEditForm(row: any) {
    this.editTransfert.patchValue({
      id: row.id,
      immo_id: row.immo_id,
      old_bureau_id: row.old_bureau?.libelle_bureau || null,
      old_employe_id: row.old_employe?.fullnameEmploye || null,
      bureau_id: row.bureau_id,
      employe_id: row.employe_id,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
      observation: row.observation,
      etat: row.etat || null,
      date_mise_en_service: this.convertToNgbDate(row.date_mise_en_service) || null
    });
  }

  getDeleteForm(row: any) {
    this.deleteTransfert.patchValue({
      id: row.id,
    })
  }

  loadImmobilisations(): void {
    this.transfertService.getAllImmobilisations().subscribe({
      next: (data) => {
        this.immobilisations = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }
  loadEmployes(): void {
    this.transfertService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }
  loadBureaux(): void {
    this.transfertService.getAllBureaux().subscribe({
      next: (data) => {
        this.bureaux = data;
        const magasin = this.bureaux.find(b => b.libelle_bureau?.toLowerCase() === 'magasin');
        this.magasinId = magasin?.id ?? null;
        console.log('DEBUG: Magasin ID loaded:', this.magasinId);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }

  updateOldInfo() {
    const idImmo = this.addTransfert.get('immo_id')?.value;
    console.log('DEBUG updateOldInfo: ID de l\'IMMO sélectionné:', idImmo);

    if (!idImmo) {
      console.log('DEBUG updateOldInfo: Aucun article sélectionné ou désélection effectuée. Réinitialisation des champs.');
      this.addTransfert.patchValue({
        old_bureau_id: null,
        old_employe_id: null,
        etat: null, // Réinitialiser l'état
        employe_id: null,
        date_mise_en_service: null
      });
      this.onBureauChange(null); // Assurez-vous que le champ État est caché et ses validateurs retirés
      return;
    }

    this.transfertService.getOldInfo(idImmo).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      (response) => {
        console.log('DEBUG updateOldInfo: Réponse de getOldInfo:', response);
        console.log('DEBUG updateOldInfo: response.bureau:', response.bureau);
        console.log('DEBUG updateOldInfo: response.employe:', response.employe);

        if (response.bureau === null && response.employe === null) {
          console.log('DEBUG updateOldInfo: Immobilisation en magasin. Patching "Ancien Bureau" avec "Magasin" et "Ancien Personnel" avec null.');
          this.addTransfert.patchValue({
            old_bureau_id: 'Magasin', // Afficher "Magasin"
            old_employe_id: null // Laisser vide
          });
        } else {
          console.log('DEBUG updateOldInfo: Immobilisation déjà affectée. Patching avec les données récupérées.');
          this.addTransfert.patchValue({
            old_bureau_id: response.bureau || null,
            old_employe_id: response.employe || null
          });
        }
      },
      (error) => {
        console.error('DEBUG updateOldInfo: Erreur lors de la récupération des infos:', error);
        this.addTransfert.patchValue({
          old_bureau_id: null,
          old_employe_id: null,
          etat: null,
          employe_id: null,
          date_mise_en_service: null
        });
        this.onBureauChange(null);
        alert("Impossible de récupérer les anciennes informations pour cette immobilisation.");
      }
    );
  }

  // Nouvelle méthode pour gérer les changements du champ bureau_id et mettre à jour l'affichage de 'etat'
  onBureauChange(event: any): void {
    const bureauId = event?.id || null; // ng-select émet l'objet entier ou null si désélectionné
    const etatControl = this.addTransfert.get('etat');
    if (!etatControl) {
      console.warn('Le contrôle "etat" est introuvable dans le groupe de formulaire addTransfert.');
      return;
    }

    console.log('DEBUG: onBureauChange triggered.');
    console.log('DEBUG: Selected bureauId:', bureauId);
    console.log('DEBUG: Stored Magasin ID:', this.magasinId);
    console.log('DEBUG: Is selected bureau Magasin?', bureauId === this.magasinId);


    // Si le bureau sélectionné est l'ID du Magasin
    if (bureauId === this.magasinId) {
      this.showEtatField = true;
      etatControl.setValidators([Validators.required]); // Rendre le champ 'etat' obligatoire
    } else {
      this.showEtatField = false;
      etatControl.clearValidators(); // Retirer les validateurs
      etatControl.setValue(null); // Vider la valeur du champ
    }
    etatControl.updateValueAndValidity(); // Mettre à jour l'état de validation du champ
  }


  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatNgbDateToYYYYMMDD(date: NgbDateStruct | null): string | null {
    if (!date) return null;
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3 && !isNaN(+parts[0]) && !isNaN(+parts[1]) && !isNaN(+parts[2])) {
      return {
        year: +parts[0],
        month: +parts[1],
        day: +parts[2],
      };
    }
    return null;
  }

  downloadTransfertsPDF(): void {
    if (!this.canExportTransfert) {
      alert('Vous n\'avez pas l\'autorisation d\'exporter la liste des transferts.');
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
