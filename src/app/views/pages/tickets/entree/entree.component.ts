import { Component, ViewChild, OnInit, inject,ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementTicketService } from '../../../../core/services/mouvement-ticket/entree.service';
import { MouvementTicket, Employe, Vehicule, CompagniePetroliere, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';


declare var bootstrap: any;

@Component({
  selector: 'app-entree',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
    NgbDatepickerModule,
    FeatherIconDirective
  ],
  templateUrl: 'entree.component.html',
  styleUrls: ['entree.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EntreeComponent implements OnInit {

 // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddEntre: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canViewEntreTicket: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canModifyEntre: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canDeleteEntre: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages


  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementTicket[] = [];
  temp: MouvementTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  employes: Employe[] = []; // Liste des employes
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  vehicules: Vehicule[] = []; // Liste des vehicules
  couponTickets: CouponTicket[] = []; // Liste des coupons

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;     // Indicateur pour l'ajout
  isEditing: boolean = false;    // Indicateur pour la modification
  isDeleting: boolean = false;   // Indicateur pour la suppression
  // -------------------------------------------------------------

  public addEntree!: FormGroup;
  public editEntree!: FormGroup;
  public deleteEntree!: FormGroup;
  addEntreeMultipleForm: FormGroup; // Note: ce formulaire est déclaré mais non initialisé

  // Fichiers sélectionnés
  selectedFiles: File[] = [];

  @ViewChild('table') table!: DatatableComponent;

  constructor(private entreeService: MouvementTicketService, private formBuilder: FormBuilder,private router: Router) { }

  ngOnInit(): void {

    this.initializePermissions();
    if (this.hasPageAccess) {
    this.loadCompagniesPetrolieres();
    this.loadCouponTickets();
    this.loadEmployes();
    this.loadVehicules();
    this.loadEntrees();
    }
    this.addEntree = this.formBuilder.group({
      compagnie_petrolier_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
    });
    this.editEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
    });
    this.deleteEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

  }

  // --- MÉTHODE UTILITAIRE POUR MARQUER TOUS LES CHAMPS COMME TOUCHÉS ---
  // Cela aide à afficher les messages d'erreur de validation immédiatement
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  // ---------------------------------------------------------------------

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
      this.canAddEntre = allowedFonctionnalites.includes('Ajout de Ticket');
      this.canModifyEntre = allowedFonctionnalites.includes('Modification de Ticket');
      this.canDeleteEntre = allowedFonctionnalites.includes('Supression de Ticket');
      this.canViewEntreTicket = allowedFonctionnalites.includes('Voir entrée de ticket');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewEntreTicket ;


      console.log('🔐 Permissions calculées:', {
        canAddEntre: this.canAddEntre,
        canModifyEntre: this.canModifyEntre,
        canDeleteEntre: this.canDeleteEntre
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        this.router.navigate(['/error/403']);
        // Optionnel: redirection automatique
        // this.router.navigate(['/dashboard']);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  onClickSubmitAddEntree() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addEntree.invalid) {
      this.markFormGroupTouched(this.addEntree); // Marque les champs pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    console.log(this.addEntree.value);

    const formData = {
      ...this.addEntree.value,
      date: this.formatDate(this.addEntree.value.date), // Convertir la date
    };

    this.entreeService.saveMouvementTicketEntree(formData).subscribe(
      (data: any) => {
        this.loadEntrees();
        this.addEntree.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_entree');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertAjoutVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
        console.error('Erreur lors de l\'ajout de l\'entree :', error);
        alert(`L'enregistrement de l'entrée de stock a échoué.\n\nDétails`);
      },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    );
  }

  onClickSubmitEditEntree() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editEntree.invalid) {
      this.markFormGroupTouched(this.editEntree); // Marque les champs pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires.");
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    console.log(this.editEntree.value);

    const id = this.editEntree.value.id;
    const formData = {
      ...this.editEntree.value,
      date: this.formatDate(this.editEntree.value.date), // Convertir la date
    };

    this.entreeService.editMouvementTicketEntree(formData).subscribe(
      (data: any) => {
        this.loadEntrees();
        this.editEntree.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_entree');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertModifVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
                console.error('Erreur lors de la modification de l\'entree :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isEditing = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier les informations de modification et réessayer.';
        
                if (error.status === 422 || error.status === 400) {
                  // Erreur de validation ou Bad Request (champs obligatoires, format, quantité invalide)
                  detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. quantité invalide, ou date incohérente).';
                  
                  // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                  if (error.error && (error.error.error || error.error.message)) {
                    const serverMessage = error.error.error || error.error.message;
                    detail = `Erreur de Validation : ${serverMessage}`;
                  }
                } else if (error.status === 404) {
                  // Entrée de stock introuvable
                  detail = 'L\'entrée de stock que vous tentez de modifier est introuvable. Elle a peut-être été supprimée par un autre utilisateur.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier cette entrée de stock.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Impossible de communiquer avec le serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && (error.error.error || error.error.message)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                alert(`La modification de l'entrée de stock a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    );
  }

  onClickSubmitDeleteEntree() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire (bien que pour une suppression par ID, c'est souvent implicitement valide)
    if (this.deleteEntree.invalid) {
      this.markFormGroupTouched(this.deleteEntree); // Marque les champs pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    console.log(this.deleteEntree.value);

    this.entreeService.deleteMouvementTicketEntree(this.deleteEntree.value).subscribe(
      (data: any) => {
        this.loadEntrees();
        this.deleteEntree.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_entree');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Attendre que le modal soit fermé avant d'afficher l'alerte
        setTimeout(() => {
          this.alertSuppVisible = true;
          console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000); // L'alerte disparaît après 2 secondes
        }, 200); // L'alerte apparaît 200ms après la fermeture du modal
      },
      (error: any) => {
                console.error('Erreur lors de la supression de l\'entree :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isDeleting = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez réessayer l\'opération. Si l\'erreur persiste, contactez le support.';
        
                if (error.status === 404) {
                  // Erreur 404 si l'entrée à supprimer n'est plus trouvée
                  detail = 'L\'entrée de stock sélectionnée est introuvable. Elle a peut-être déjà été supprimée.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour supprimer cette entrée de stock.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                } else if (error.error && (error.error.message || error.error.error)) {
                  // Tente d'afficher le message d'erreur spécifique du serveur
                  const serverMessage = error.error.message || error.error.error;
                  detail = `Raison : ${serverMessage}. L'entrée n'a pas pu être supprimée.`;
                }
        
                // Message final clair
                alert(`La suppression de l'entrée de stock a échoué.\n\nDétails : ${detail}\n\nEn cas d'échec répété, veuillez contacter le support technique.`);
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    );
  }

  loadVehicules(): void {
    this.entreeService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des véhicules :", err);
      }
    });
  }
  loadEmployes(): void {
    this.entreeService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employes :", err);
      }
    });
  }
  loadCouponTickets(): void {
    this.entreeService.getAllCouponTickets().subscribe({
      next: (data) => {
        this.couponTickets = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des couponTickets :", err);
      }
    });
  }
  loadCompagniesPetrolieres(): void {
    this.entreeService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagniePetrolieres :", err);
      }
    });
  }


  loadEntrees(): void {
    this.entreeService.getAllMouvementTicketEntree().subscribe(
      (data: MouvementTicket[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Ticket Entree', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(entre =>
  //     entre.description.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(entre =>
      (entre.description && entre.description.toLowerCase().includes(val)) ||
      (entre.coupon_ticket && entre.coupon_ticket.libelle && entre.coupon_ticket.libelle.toLowerCase().includes(val)) ||
      (entre.compagnie_petrolier && entre.compagnie_petrolier.libelle && entre.compagnie_petrolier.libelle.toLowerCase().includes(val)) ||
      (entre.objet && entre.objet.toLowerCase().includes(val)) ||
      (entre.qte && String(entre.qte).toLowerCase().includes(val))
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editEntree.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      objet: row.objet,
      description: row.description,
      qte: row.qte,
      date: this.convertToNgbDate(row.date),
    })
  }

  getDeleteForm(row: any) {
    this.deleteEntree.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

}
