import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleExerciceService } from '../../../../core/services/article-exercice/article-exercice.service';
import { ExerciceMouvementTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,AbstractControl,ValidationErrors  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';


declare var bootstrap: any;
import { Router } from '@angular/router';
import { ExerciceMouvementTicketService } from '../../../../core/services/exercice-mouvementTicket/exercice-mouvementTicket.service';

@Component({
  selector: 'app-exercice',
  standalone: true,
  imports: [
RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    MyNgSelectComponent
  ],
  templateUrl: 'exercice-mouvementticket.component.html'
})
export class ExerciceMouvementTicketComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages
  exerciceMouvementticket: ExerciceMouvementTicket[] = [];

  exerciceTicket: any[] = [];

  today: NgbDateStruct = inject(NgbCalendar).getToday();
  firstDayOfYear: NgbDateStruct;
  lastDayOfYear: NgbDateStruct;

  rows: ExerciceMouvementTicket[] = [];
  temp: ExerciceMouvementTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  // Ajoutez ces propriétés pour la gestion du modal de confirmation
  showConfirmationModal = false;
  confirmationMessage = '';
  exerciceToChangeStatusId: number | null = null;
  newStatus: 'ouvert' | 'cloture' | null = null;


  public addExercice!: FormGroup;
  public editExercice!: FormGroup;
  public deleteExercice!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private exerciceMouvementTicketService: ExerciceMouvementTicketService, private formBuilder: FormBuilder, private router: Router) {

  }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadAllData();
    }

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
        console.warn('❌ Accès refusé parametrages de Exercice');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
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

loadAllData(): void {
    this.loadingIndicator = true;
    // Charger les articles exercices et stocker la copie
    this.exerciceMouvementTicketService.getAllExerciceMouvementTickets().subscribe({
      next: (data) => {
        // Copier les données complètes dans `temp` pour le filtrage
        this.temp = [...data];
        // Affecter les données à `rows` pour l'affichage initial
        this.rows = data;
        this.loadingIndicator = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des exercices mouvement ticket', err);
        this.loadingIndicator = false;
      }
    });

    // Charger la liste des exercices pour le select
    this.exerciceMouvementTicketService.getAllExerciceMouvementTickets().subscribe({
      next: (data) => {
        this.exerciceMouvementticket = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des exercices', err);
      }
    });
  }

updateFilter(event: KeyboardEvent): void {
  const val = (event.target as HTMLInputElement).value.toLowerCase();

  this.rows = this.temp.filter(row =>
    // Filtrer par le libellé du Coupon Ticket
    row.coupon_ticket?.libelle?.toLowerCase().includes(val) ||
    // Filtrer par l'année de l'Exercice
    row.exercice?.annee?.toString().toLowerCase().includes(val) ||
    // Filtrer par le libellé de la Compagnie Pétrolière
    row.compagnie_petrolier?.libelle?.toLowerCase().includes(val) ||
    // Filtrer par la quantité actuelle
    row.qte_actuel?.toString().toLowerCase().includes(val)
  );

  // Vérifier si la table existe avant de réinitialiser l’offset
  if (this.table) {
    this.table.offset = 0;
  }
}

filterByExercice(selectedExerciceId: number | null): void {
  if (selectedExerciceId) {
    // Filtrer en utilisant l'ID de l'exercice dans l'objet imbriqué
    const filteredRows = this.temp.filter(row => row.exercice?.id === selectedExerciceId);
    this.rows = filteredRows;
  } else {
    // Si la sélection est annulée, réinitialiser le tableau
    this.rows = [...this.temp];
  }
}

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }
}


