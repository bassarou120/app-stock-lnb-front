import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { NgbAlertModule, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DemandeImmoService } from '../../../core/services/demande-immos/demande-immo.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-demande-immo',
  standalone: true,
  templateUrl: './demande-immo.component.html',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, NgbAlertModule, 
    FormsModule, NgSelectComponent, NgbDatepickerModule
  ],
})
export class DemandeImmoComponent implements OnInit, OnDestroy {
  demandes: any[] = [];
  filteredDemandes: any[] = [];
  loading = false;
  isProcessing = false;

  // Permissions
  canViewDemande = true;
  canValidDemande = true;
  canRefuseDemande = true;
  hasPageAccess = true;
  
  // Données pour les listes de sélection (Backend)
  immobilisations: any[] = []; 
  bureaux: any[] = [];

  selectedDemande: any = null;
  selectedFile: File | null = null;
  selectedImmoDesignation: string = '';
  
  public validationForm!: FormGroup;
  public clotureForm!: FormGroup;

  private destroy$ = new Subject<void>();
  alertModifVisible: boolean = false;
  alertModifAllVisible: boolean = false;

  constructor(
    private immoService: DemandeImmoService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializePermissions();
    if (this.hasPageAccess) {
      this.loadDemandes();
      this.loadInitialData(); // Chargement des bureaux et immos pour les modaux
    }
    this.initForms();
  }

  initForms() {
    // Formulaire VALIDE : aligné sur le switch(status) 'VALIDE' de Laravel
    this.validationForm = this.fb.group({
      immo_id: [null, Validators.required],
      bureau_id: [null, Validators.required],
      employe_id: [null], // Sera patché avec l'ID de l'employé de la demande
      status: ['VALIDE']
    });

    // Formulaire CLOTUREE : aligné sur le switch(status) 'CLOTUREE' de Laravel
    this.clotureForm = this.fb.group({
      fichier: [null, Validators.required],
      status: ['CLOTUREE']
    });
  }

  loadInitialData() {
    // Charger les immobilisations disponibles pour la validation
    this.immoService.getAllImmobilisations().pipe(takeUntil(this.destroy$)).subscribe(res => this.immobilisations = res);
    // Charger les bureaux pour le transfert
    this.immoService.getAllBureaux().pipe(takeUntil(this.destroy$)).subscribe(res => this.bureaux = res);
  }

  loadDemandes() {
    this.loading = true;
    this.immoService.getAllDemandesImmo().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.demandes = res;
        this.filteredDemandes = [...this.demandes];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // --- GESTION DES MODAUX ---

  openValidationModal(demande: any) {
    this.selectedDemande = demande;
    this.selectedImmoDesignation = '';
    this.validationForm.reset({ 
      status: 'VALIDE', 
      employe_id: demande.id_employe // Pré-remplissage pour le transfert Laravel
    });
    const modal = new bootstrap.Modal(document.getElementById('modalValidation'));
    modal.show();
  }
  
  onImmoChange(event: any) {
    if (event) {
      // 'event' contient l'objet complet de l'immobilisation sélectionnée
      this.selectedImmoDesignation = event.designation;
    } else {
      this.selectedImmoDesignation = '';
    }
  }

  openClotureModal(demande: any) {
    this.selectedDemande = demande;
    this.clotureForm.reset({ status: 'CLOTUREE' });
    this.selectedFile = null;
    const modal = new bootstrap.Modal(document.getElementById('modalCloture'));
    modal.show();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.clotureForm.patchValue({ fichier: this.selectedFile });
  }

  // --- ENVOI AU BACKEND ---

  submitValidation() {
    if (this.validationForm.invalid) return;
    this.updateStatus('VALIDE', this.validationForm.value);
  }

  submitCloture() {
    if (this.clotureForm.invalid) return;
    this.updateStatus('CLOTUREE'); // Le fichier est géré par la propriété selectedFile
  }

  updateStatus(status: string, extraData?: any) {
    this.isProcessing = true;
    const id = this.selectedDemande.id;

    const formData = new FormData();
    formData.append('status', status);

    // Ajout des IDs pour VALIDE (immo_id, bureau_id, employe_id)
    if (extraData) {
      Object.keys(extraData).forEach(key => {
        if (extraData[key]) formData.append(key, extraData[key]);
      });
    }

    // Ajout du fichier pour CLOTUREE
    if (this.selectedFile) {
      formData.append('fichier', this.selectedFile);
    }

    this.immoService.changerStatusDemande(id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isProcessing = false;
        this.closeModals();
        this.loadDemandes();
        Swal.fire('Succès', `Opération effectuée : ${status}`, 'success');
      },
      error: (err) => {
        this.isProcessing = false;
        Swal.fire('Erreur', err.error.message || 'Le serveur a rencontré une erreur', 'error');
      }
    });
  }

  // downloadBonSortie(demande: any) {
  //   const url = this.immoService.getBonSortieUrl(demande.id);
  //   window.open(url, '_blank'); // Ouvre le PDF du bon de sortie généré par le back
  // }

  downloadBonSortie(demande: any) {
    this.immoService.getFicheDemande(demande.id).subscribe({
      next: (blob) => {
        // On crée une URL temporaire pour le fichier reçu
        const fileUrl = window.URL.createObjectURL(blob);
        // On l'ouvre dans un nouvel onglet
        window.open(fileUrl, '_blank');
      },
      error: (err) => {
        console.error("Erreur lors du téléchargement de la fiche", err);
        // Optionnel : ajouter une alerte pour l'utilisateur
      }
    });
  }


  confirmRejet(demande: any) {
    Swal.fire({
      title: 'Rejeter cette demande ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Oui, rejeter'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedDemande = demande;
        this.updateStatus('REJETE');
      }
    });
  }

  // --- UTILITAIRES ---

  private initializePermissions(): void {
    const permissions = JSON.parse(localStorage.getItem('allowedFonctionnalites') || '[]');
    this.canViewDemande = permissions.includes('Voir Les demandes');
    this.canValidDemande = permissions.includes('Validation de demande');
    this.canRefuseDemande = permissions.includes('Refus de demande');
    this.hasPageAccess = this.canViewDemande;
    if (!this.hasPageAccess) this.router.navigate(['/error/403']);
  }

  closeModals() {
    ['modalValidation', 'modalCloture'].forEach(id => {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        bsModal?.hide();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    this.filteredDemandes = this.demandes.filter(d => 
      d.ref_demande.toLowerCase().includes(val) || 
      (d.employe?.nom && d.employe.nom.toLowerCase().includes(val))
    );
  }
}