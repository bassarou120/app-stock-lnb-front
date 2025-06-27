import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsService } from '../../../../core/services/intervention/intervention.service'; // This import seems unused based on provided code, consider removing if not needed.
import { Trajet, Commune, MouvementTicket, TypeMouvement } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { TrajetsService } from '../../../../core/services/trajets/trajets.service';


declare var bootstrap: any;

@Component({
  selector: 'app-trajet',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    MyNgSelectComponent,
    FeatherIconDirective

  ],
  templateUrl: 'trajets.component.html'
})
export class TrajetComponent implements OnInit {
    // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamParc: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Trajet[] = [];
  temp: Trajet[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;   // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;   // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;   // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addTrajet!: FormGroup;
  public editTrajet!: FormGroup;
  public deleteTrajet!: FormGroup;

  communes: Commune[] = []; // Liste des communes
  mouvementTickets: MouvementTicket[] = []; // Liste des mouvements de tickets (correction du nom)
  //type_mouvements: TypeMouvement[] = []; // Liste des mouvements


  @ViewChild('table') table!: DatatableComponent;

  constructor(private trajetService: TrajetsService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    this.loadCommunes();
    this.loadMouvementTickets();
    this.loadTrajets();

    this.addTrajet = this.formBuilder.group({
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      trajet_aller_retour: [false, []],
      valeur: ["" ,[Validators.required]],
      observation: ["", []],
    });
    this.editTrajet = this.formBuilder.group({
      id: [0, [Validators.required]],
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      trajet_aller_retour: [false, []],
      valeur: ["" ,[Validators.required]],
      observation: ["", []],
    });
    this.deleteTrajet = this.formBuilder.group({
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
      this.canVoirParamParc = allowedFonctionnalites.includes('Voir Parametres Parc');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamParc;

      console.log('🔐 Permissions calculées:', {
        canVoirParamParc: this.canVoirParamParc,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de parc');
        // Optionnel: redirection automatique
        // this.router.navigate(['/dashboard']);
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

  onClickSubmitAddTrajet() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de trajet déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addTrajet.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addTrajet.invalid) {
      this.markFormGroupTouched(this.addTrajet); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    this.trajetService.saveTrajet(this.addTrajet.value).subscribe({
      next: (data: any) => {
        this.loadTrajets();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.addTrajet.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_trajet');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout du trajet :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }

  onClickSubmitEditTrajet() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de trajet déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editTrajet.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editTrajet.invalid) {
      this.markFormGroupTouched(this.editTrajet);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editTrajet.value.id;
    this.trajetService.editTrajet(this.editTrajet.value).subscribe({
      next: (data: any) => {
        this.loadTrajets();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.editTrajet.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_trajet');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification du trajet :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteTrajet() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de trajet déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteTrajet.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteTrajet.invalid) {
      this.markFormGroupTouched(this.deleteTrajet);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.trajetService.deleteTrajet(this.deleteTrajet.value).subscribe({
      next: (data: any) => {
        this.loadTrajets();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        this.deleteTrajet.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_trajet');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

          // Utilisation de la transition pour faire apparaître l'alerte
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du trajet :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
  }

  loadTrajets(): void {
    this.trajetService.getAllTrajet().subscribe( // Assurez-vous que cette méthode existe dans TrajetsService
      (data: Trajet[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        console.log('Structure de this.rows :', this.rows);
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des trajets', error); // Correction du message d'erreur
        this.loadingIndicator = false;
      }
    );
  }

  loadCommunes(): void {
    this.trajetService.getAllCommunes().subscribe({ // Assurez-vous que cette méthode existe dans TrajetsService
      next: (data) => {
        this.communes = data; // Stocker la liste des communes
        console.log('Communes chargées :', this.communes);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
      }
    });
  }

  loadMouvementTickets(): void {
    this.trajetService.getAllMouvementTicketSortie().subscribe({
      next: (data) => {
        this.mouvementTickets = data;
        console.log('Mouvement Tickets chargés :', this.mouvementTickets);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des mouvements de tickets :", err);
      }
    });
  }

  // loadTypeMouvements(): void {
  //   this.trajetService.getAllTypeMouvement().subscribe({
  //     next: (data) => {
  //       this.type_mouvements = data; // Stocker la liste des couponTickets
  //     },
  //     error: (err) => {
  //       console.error("Erreur lors du chargement des couponTickets :", err);
  //     }
  //   });
  // }


  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(trajet =>
      String(trajet.id).toLowerCase().includes(val) ||
      (trajet.observation ? trajet.observation.toLowerCase().includes(val) : false)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editTrajet.patchValue({
      id: row.id,
      MouvementTicket_id: row.MouvementTicket_id,
      commune_depart: row.commune_depart,
      commune_arriver: row.commune_arriver,
      trajet_aller_retour: row.trajet_aller_retour,
      observation: row.observation,
      valeur: row.valeur,
    });
  }

  getDeleteForm(row: any) {
    this.deleteTrajet.patchValue({
      id: row.id,
    });
  }
}