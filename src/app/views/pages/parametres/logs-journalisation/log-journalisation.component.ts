import { Component, OnInit, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbAlertModule, NgbDateStruct, NgbDropdownModule, NgbInputDatepicker, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LogFilters, LogJournalisation, LogJournalisationService } from '../../../../core/services/logs-journalisation/log-journalisation.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../../core/services/interface/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-logs-journalisation',
  standalone: true,
  imports: [
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    RouterLink,
    NgbInputDatepicker
  ],
  templateUrl: './log-journalisation.component.html',
})
export class LogJournalisationComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;

  rows: LogJournalisation[] = [];
  temp: LogJournalisation[] = [];
  ColumnMode = ColumnMode;
  loadingIndicator = true;
  hasPageAccess = true;
  selectedLogDetails: string | null = null;
  selectedLogAction: string | null = null;
  selectedLogUserAgent: string | null = null;

  // NOUVELLE PROPRIÉTÉ : Formulaire de filtre
  filterForm!: FormGroup;
  users: User[] = []; // Liste des utilisateurs pour le filtre (à charger via un autre service)

  constructor(
    private logService: LogJournalisationService,
    private modalService: NgbModal,
    private fb: FormBuilder // INJECTION DU FORMBUILDER
  ) {}

  ngOnInit(): void {
    // 1. Initialisation du formulaire de filtre
    this.filterForm = this.fb.group({
      action: [''],
      user_id: [null], // Pour les NgSelect/Dropdowns
      date_debut: [null], // Pour NgbDateStruct
      date_fin: [null],   // Pour NgbDateStruct
    });

    // 2. Initialisation : Charger les données sans filtre au démarrage
    // Le chargement des utilisateurs (this.loadUsers()) doit être appelé ici si nécessaire
    this.applyFilters(); // Utilise le formulaire vide pour charger la liste complète
  }

  /**
   * UTILITAIRE : Convertit NgbDateStruct en chaîne de caractères YYYY-MM-DD
   * attendue par l'API Laravel.
   */
  private formatDate(date: NgbDateStruct | null): string | undefined {
    if (date && date.year && date.month && date.day) {
      const month = String(date.month).padStart(2, '0');
      const day = String(date.day).padStart(2, '0');
      return `${date.year}-${month}-${day}`;
    }
    return undefined;
  }

  /**
   * UTILITAIRE : Construit l'objet LogFilters à partir du formulaire.
   */
  private getFiltersFromForm(): LogFilters {
    const formValues = this.filterForm.value;

    // Ne retourne que les valeurs définies pour que l'API ignore les filtres vides
    const filters: LogFilters = {};

    if (formValues.action) {
        filters.action = formValues.action;
    }

    // Le NgSelect peut retourner null ou l'ID. On s'assure que c'est bien l'ID (number)
    if (formValues.user_id !== null && formValues.user_id !== undefined) {
        filters.user_id = Number(formValues.user_id);
    }

    const dateDebut = this.formatDate(formValues.date_debut);
    if (dateDebut) {
        filters.date_debut = dateDebut;
    }

    const dateFin = this.formatDate(formValues.date_fin);
    if (dateFin) {
        filters.date_fin = dateFin;
    }

    return filters;
  }

  /**
   * Récupère les logs du serveur en utilisant les filtres spécifiés.
   * @param filters - Les filtres à appliquer.
   */
  fetchLogs(filters?: LogFilters): void {
    this.loadingIndicator = true;
    this.logService.getLogs(filters).subscribe({
      next: (response) => {
        this.rows = response.data;
        this.temp = [...response.data]; // Mise à jour de la copie locale si nécessaire
        this.loadingIndicator = false;
        if (this.table) this.table.offset = 0;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des logs", err);
        this.loadingIndicator = false;
        // Gérer l'affichage d'un message d'erreur utilisateur
      }
    });
  }

  /**
   * DÉCLENCHÉ PAR LE BOUTON 'CHARGER'
   * Applique les filtres définis dans le formulaire et recharge les logs.
   */
  applyFilters(): void {
    const filters = this.getFiltersFromForm();
    this.fetchLogs(filters);
  }

  /**
   * Réinitialise les filtres du formulaire et recharge la liste complète.
   */
  clearFilters(): void {
    this.filterForm.reset({
        action: '',
        user_id: null,
        date_debut: null,
        date_fin: null
    });
    this.applyFilters(); // Recharge les logs sans filtres
  }

  /**
   * MODIFIÉ : Met à jour le filtre de texte de recherche et recharge les logs.
   */
  updateFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.filterForm.patchValue({ action: val });
    this.applyFilters();
  }

  /**
   * DÉCLENCHÉ PAR LE BOUTON 'EXPORTER PDF'
   * Génère le PDF en utilisant les filtres courants.
   */
  printLogs(): void {
    const filters = this.getFiltersFromForm();
    this.loadingIndicator = true;

    this.logService.exportLogs(filters).subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `journalisation_actions_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL); // Libère la mémoire

        this.loadingIndicator = false;
      },
      error: (err) => {
        console.error("Erreur lors de l'exportation des logs", err);
        this.loadingIndicator = false;
        Swal.fire({
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la génération du PDF.',
          icon: 'error',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  getDetailUserAgent(userAgent: string | null): string {
    if (!userAgent) return 'Aucun User-Agent disponible';

    let browser = 'Inconnu';
    let os = 'Inconnu';

    // Détection simple du navigateur
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
      browser = 'Google Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Mozilla Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browser = 'Microsoft Edge';
    } else if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
      browser = 'Opera';
    }

    // Détection simple du système d’exploitation
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Macintosh')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    }

    return `${browser} sur ${os}`;
  }

  viewDetails(row: LogJournalisation, content: any): void {
    this.selectedLogDetails = row.details;
    this.selectedLogAction = row.action;
    this.selectedLogUserAgent = row.user_agent;
    this.modalService.open(content, { size: 'lg' });
  }
}
