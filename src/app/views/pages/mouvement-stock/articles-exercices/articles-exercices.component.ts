import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleExerciceService } from '../../../../core/services/article-exercice/article-exercice.service';
import { ArticleExercice } from '../../../../core/services/interface/models';
import { ExerciceService } from '../../../../core/services/exercice/exercice.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,AbstractControl,ValidationErrors  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { Exercice } from '../../../../core/services/interface/models';



declare var bootstrap: any;
import { Router } from '@angular/router';

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
  templateUrl: 'articles-exercices.component.html'
})
export class ArticleExerciceComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages
  exercices: any[] = [];

  today: NgbDateStruct = inject(NgbCalendar).getToday();
  firstDayOfYear: NgbDateStruct;
  lastDayOfYear: NgbDateStruct;

  rows: ArticleExercice[] = [];
  temp: ArticleExercice[] = [];
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

  constructor(private articleExerciceService: ArticleExerciceService, private exerciceService: ExerciceService, private formBuilder: FormBuilder, private router: Router) {

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
    this.articleExerciceService.getAllArticlExercices().subscribe({
      next: (data) => {
        // Copier les données complètes dans `temp` pour le filtrage
        this.temp = [...data];
        // Affecter les données à `rows` pour l'affichage initial
        this.rows = data;
        this.loadingIndicator = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des articles exercices', err);
        this.loadingIndicator = false;
      }
    });

    // Charger la liste des exercices pour le select
    this.exerciceService.getAllExercice().subscribe({
      next: (data) => {
        this.exercices = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des exercices', err);
      }
    });
  }

  filterByExercice(selectedExerciceId: number | null): void {
    // S'assurer que selectedExerciceId est bien un nombre
    if (selectedExerciceId) {
      // Filtrer le tableau temp (la source de vérité)
      const filteredRows = this.temp.filter(row => row.id_exercice === selectedExerciceId);
      this.rows = filteredRows;
    } else {
      // Si la sélection est annulée (valeur null), réinitialiser le tableau
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


