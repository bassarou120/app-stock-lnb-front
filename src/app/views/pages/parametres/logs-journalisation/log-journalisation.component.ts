import { Component, OnInit, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgbAlertModule, NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LogJournalisation, LogJournalisationService } from '../../../../core/services/logs-journalisation/log-journalisation.service'; 
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-logs-journalisation',
  standalone: true,
  imports: [
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    RouterLink
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

  constructor(
    private logService: LogJournalisationService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(): void {
    this.loadingIndicator = true;
    this.logService.getLogs().subscribe({
      next: (response) => {
        this.rows = response.data;
        this.temp = [...response.data];
        this.loadingIndicator = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des logs", err);
        this.loadingIndicator = false;
      }
    });
  }

  updateFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    
    // Assurez-vous que 'user_name_full' existe sur l'objet LogJournalisation
    this.rows = this.temp.filter(d =>
      d.action.toLowerCase().includes(val) ||
      d.ip_address.toLowerCase().includes(val) ||
      // Ancienne vérification par user_id (vous pouvez la laisser si vous le souhaitez)
      (d.user_id !== null && d.user_id.toString().includes(val)) ||
      // Nouvelle vérification pour le nom complet de l'utilisateur
      ('user_name_full' in d && d['user_name_full']?.toLowerCase().includes(val)) || 
      !val
    );
    
    if (this.table) this.table.offset = 0;
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
