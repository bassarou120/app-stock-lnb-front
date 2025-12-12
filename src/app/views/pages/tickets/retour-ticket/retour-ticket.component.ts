import { Component, ViewChild, OnInit,ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { RetourTicketService } from '../../../../core/services/retour-ticket/retour-ticket.service';
import { RetourTicket, CompagniePetroliere, MouvementTicket, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';
declare var bootstrap: any;

@Component({
  selector: 'retour-ticket',
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

  ],
  templateUrl: 'retour-ticket.component.html',
  styleUrls: ['retour-ticket.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RetourTicketComponent implements OnInit {
    // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddRetourTicket: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres
  canModifyRetourTicket: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres
  canDeleteRetourTicket: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres
  canVoirRetourTicket: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: RetourTicket[] = [];
  temp: RetourTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  mouvementsTickets: MouvementTicket[] = []; // Liste des mouvements de sortie
  couponsTickets: CouponTicket[] = []; // Liste des coupons ticket
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  ancienQteDuMvt: number; // Quantité de l'ancien mouvement (utilisée pour la validation Max)

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  // --- NOUVELLE PROPRIÉTÉ POUR GÉRER LE CLIC MULTIPLE À L'AJOUT ---
  isAdding: boolean = false; // Indicateur pour l'ajout
  isEditing: boolean = false; // Indicateur pour la modification
  isDeleting: boolean = false; // Indicateur pour la suppression
  // ------------------------------------------------------------------

  public addRetourTicket!: FormGroup;
  public editRetourTicket!: FormGroup;
  public deleteRetourTicket!: FormGroup;

  defaultDate: string = '';

  @ViewChild('table') table!: DatatableComponent;

  constructor(private retourTicketService: RetourTicketService, private formBuilder: FormBuilder,private router: Router) { }

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    if (this.hasPageAccess) {
    this.loadAllSortieTicketWhereNotInRetour();
    this.loadRetourTickets();
    this.loadCompagniePetrolieres();
    this.loadCouponTickets();
    this.loadMouvementsTickets();
    }

    this.defaultDate = this.formatDate(new Date());

    this.addRetourTicket = this.formBuilder.group({
      mouvementTicket_id: [null, [Validators.required]],
      // coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      // qte: [1, [Validators.required]],
      retours_coupons: this.formBuilder.array([]),
    });
    this.editRetourTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
    });
    this.deleteRetourTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  formatDate(date: Date): string {
      // Garder cette fonction pour le format YYYY-MM-DD
      return date.toISOString().split('T')[0];
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
      this.canAddRetourTicket = allowedFonctionnalites.includes('Ajout Retour Ticket');
      this.canModifyRetourTicket = allowedFonctionnalites.includes('Modification Retour Ticket');
      this.canDeleteRetourTicket = allowedFonctionnalites.includes('Supprimer Retour Ticket');
      this.canVoirRetourTicket = allowedFonctionnalites.includes('Voir Retour Ticket');


      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirRetourTicket;

      console.log('🔐 Permissions calculées:', {
        canVoirRetourTicket: this.canVoirRetourTicket,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé retour des tickets');
        this.router.navigate(['/error/403']);
        // Optionnel: redirection automatique
        // this.router.navigate(['/dashboard']);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  private createCouponReturnFormGroup(couponDetail: any): FormGroup {
    const qteMax = couponDetail.quantite_max_retournable;

    return this.formBuilder.group({
        // CHAMPS DU PAYLOAD FINAL (cachés)
        mouvement_ticket_id: [couponDetail.mouvement_ticket_id, Validators.required],
        coupon_ticket_id: [couponDetail.coupon_ticket_id, Validators.required],
        compagnie_petrolier_id: [couponDetail.compagnie_petrolier_id, Validators.required],

        // CHAMPS POUR L'AFFICHAGE/VALIDATION
        libelle_affichage: [couponDetail.libelle_affichage], // Coupon (Compagnie)
        quantite_max_retournable: [qteMax],

        // CHAMP DE SAISIE UTILISATEUR
        qte_retournee: [
            qteMax, // Pré-remplir avec la quantité max pour dégriser
            [
                Validators.required,
                Validators.min(1),
                Validators.max(qteMax)
            ]
        ],
        date_retour: [this.defaultDate, Validators.required],
    });
}


  // --- MÉTHODE UTILITAIRE POUR MARQUER TOUS LES CHAMPS COMME TOUCHÉS ---
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  // ---------------------------------------------------------------------

  // onClickSubmitAddRetourTicket() {

  //   if (!this.canAddRetourTicket) {
  //     alert('Vous n\'avez pas l\'autorisation d\'effectuer un retour de ticket.');
  //     return;
  //   }

  //   // 1. Vérifier si une soumission est déjà en cours
  //   if (this.isAdding) {
  //     console.warn('Ajout de retour de ticket déjà en cours. Opération annulée.');
  //     return;
  //   }

  //   // 2. Valider le formulaire
  //   if (this.addRetourTicket.invalid) {
  //     this.markFormGroupTouched(this.addRetourTicket); // Marque les champs pour afficher les erreurs
  //     alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.");
  //     return; // Bloque la soumission si le formulaire est invalide
  //   }

  //   // 3. Activer l'indicateur de chargement
  //   this.isAdding = true;
  //   console.log(this.addRetourTicket.value);

  //   this.retourTicketService.saveRetourTicket(this.addRetourTicket.value).subscribe(
  //     (data: any) => {
  //       this.loadRetourTickets();
  //       this.loadAllSortieTicketWhereNotInRetour(); // Recharger les mouvements disponibles
  //       this.addRetourTicket.reset();

  //       // Fermer le modal manuellement
  //       const modal = document.getElementById('add_retour');
  //       // @ts-ignore - pour éviter les erreurs TypeScript
  //       const bsModal = bootstrap.Modal.getInstance(modal);
  //       bsModal?.hide();

  //       // Attendre que le modal soit fermé avant d'afficher l'alerte
  //       setTimeout(() => {
  //         this.alertAjoutVisible = true;
  //         console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

  //         setTimeout(() => {
  //           this.alertAjoutVisible = false;
  //         }, 2000); // L'alerte disparaît après 2 secondes
  //       }, 200); // L'alerte apparaît 200ms après la fermeture du modal
  //     },
  //     (error: any) => {
  //       console.error('Erreur lors de l\'ajout du retour de ticket :', error);
  //       alert('Une erreur s\'est produite. Veuillez réessayer.');
  //     },
  //     () => {
  //       // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
  //       this.isAdding = false;
  //     }
  //   );
  // }
  // Fichier : retour-ticket.component.ts (Méthode onClickSubmitAddRetourTicket)

  //Nouveau
  onClickSubmitAddRetourTicket() {

    if (!this.canAddRetourTicket) {
      alert('Vous n\'avez pas l\'autorisation d\'effectuer un retour de ticket.');
      return;
    }

    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout de retour de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Validation du Formulaire (Incluant les éléments du FormArray)

    // Marquer le formulaire principal et tous les sous-groupes du FormArray comme touchés
    this.addRetourTicket.markAllAsTouched();
    this.retoursCouponsArray.controls.forEach(control => control.markAllAsTouched());

    // Vérifier si le formulaire principal est invalide OU si le FormArray est vide
    if (this.addRetourTicket.invalid || this.retoursCouponsArray.length === 0) {
      console.log("Formulaire Invalide ou FormArray vide. État actuel:", this.addRetourTicket.value);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier la Référence de Sortie et les quantités à retourner pour chaque coupon.");
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Préparation du Payload pour le Backend
    // Le backend s'attend à recevoir le tableau 'retours_coupons'
    const payload = {
        retours_coupons: this.retoursCouponsArray.value
    };

    console.log('Payload soumis:', payload);
    console.log('Exemple de coupon avec date_retour:', payload.retours_coupons[0]);

    // 4. Activer l'indicateur de chargement
    this.isAdding = true;

    // 5. Appel au service (Le nom du service reste le vôtre : saveRetourTicket)
    this.retourTicketService.saveRetourTicket(payload as any).subscribe( // 💡 Changement ici: on envoie 'payload'
      (data: any) => {
        this.loadRetourTickets();
        this.loadAllSortieTicketWhereNotInRetour(); // Recharger les mouvements disponibles
        this.addRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_retour');
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
                console.error('Erreur lors de l\'ajout du retour de ticket :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isAdding = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier les informations du formulaire (ticket, quantité) et réessayer.';
        
                if (error.status === 422 || error.status === 400) {
                  // Erreur de validation ou Bad Request (quantité, ticket déjà retourné)
                  detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. quantité de retour supérieure à la quantité sortie, ou ticket déjà retourné).';
                  
                  // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                  if (error.error && (error.error.error || error.error.message)) {
                    const serverMessage = error.error.error || error.error.message;
                    detail = `Erreur de Validation : ${serverMessage}`;
                  }
                } else if (error.status === 404) {
                  // Ticket de sortie introuvable
                  detail = 'Le ticket de sortie sélectionné est introuvable. Veuillez recharger la liste.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour enregistrer ce retour de ticket.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Impossible de communiquer avec le serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && (error.error.error || error.error.message)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                alert(`L'enregistrement du retour de ticket a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
              },
      () => {
        // 6. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    );
  }

  onClickSubmitEditRetourTicket() {

    if (!this.canModifyRetourTicket) {
      alert('Vous n\'avez pas l\'autorisation de mettre à jour un retour de ticket.');
      return;
    }
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification de retour de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editRetourTicket.invalid) {
      this.markFormGroupTouched(this.editRetourTicket);
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    console.log(this.editRetourTicket.value);

    const id = this.editRetourTicket.value.id;
    this.retourTicketService.editRetourTicket(this.editRetourTicket.value).subscribe(
      (data: any) => {
        this.loadRetourTickets();
        this.loadAllSortieTicketWhereNotInRetour(); // Recharger les mouvements disponibles
        this.editRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_retourTicket');
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
                console.error('Erreur lors de la modification du retour Ticket:', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isEditing = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier les informations de modification et réessayer.';
        
                if (error.status === 422 || error.status === 400) {
                  // Erreur de validation (quantité, ticket, règles métier)
                  detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. quantité de retour invalide ou ticket non modifiable).';
                  
                  // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                  if (error.error && (error.error.error || error.error.message)) {
                    const serverMessage = error.error.error || error.error.message;
                    detail = `Erreur de Validation : ${serverMessage}`;
                  }
                } else if (error.status === 404) {
                  // Retour introuvable
                  detail = 'Le retour de ticket que vous tentez de modifier est introuvable. Il a peut-être été supprimé par un autre utilisateur.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier ce retour de ticket.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Impossible de communiquer avec le serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && (error.error.error || error.error.message)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                alert(`La modification du retour de ticket a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    );
  }

  onClickSubmitDeleteRetourTicket() {

    if (!this.canDeleteRetourTicket) {
      alert('Vous n\'avez pas l\'autorisation de supprimer un retour de ticket.');
      return;
    }
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression de retour de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteRetourTicket.invalid) {
      this.markFormGroupTouched(this.deleteRetourTicket);
      alert("Désolé, le formulaire n'est pas bien renseigné.");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    console.log(this.deleteRetourTicket.value);

    this.retourTicketService.deleteRetourTicket(this.deleteRetourTicket.value).subscribe(
      (data: any) => {
        this.loadRetourTickets();
        this.loadAllSortieTicketWhereNotInRetour(); // Recharger les mouvements disponibles
        this.deleteRetourTicket.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_retour');
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
                console.error('Erreur lors de la suppression du retour Ticket :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isDeleting = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez réessayer l\'opération. Si l\'erreur persiste, contactez le support.';
        
                if (error.status === 404) {
                  // Erreur 404 si le retour à supprimer n'est plus trouvé
                  detail = 'Le retour de ticket sélectionné est introuvable. Il a peut-être déjà été supprimé.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour supprimer ce retour de ticket.';
                } else if (error.status === 422 || error.status === 400) {
                  // Erreur de validation/règles métier (ex: le ticket associé est utilisé)
                  detail = 'La suppression est impossible. Une règle métier bloque cette opération (ex: le ticket de sortie est utilisé ou bloqué).';
                  
                  // Tente d'afficher le message d'erreur spécifique du serveur
                  if (error.error && (error.error.message || error.error.error)) {
                    const serverMessage = error.error.message || error.error.error;
                    detail = `Raison : ${serverMessage}. La suppression n'a pas pu être effectuée.`;
                  }
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                } else if (error.error && (error.error.message || error.error.error)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                alert(`La suppression du retour de ticket a échoué.\n\nDétails : ${detail}\n\nEn cas d'échec répété, veuillez contacter le support technique.`);
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    );
  }

  // loadAllSortieTicketWhereNotInRetour(): void {
  //   this.retourTicketService.getAllSortieTicketWhereNotInRetour().subscribe({
  //     next: (data) => {
  //       this.mouvementsTickets = data;
  //       console.error(" voici la liste", this.mouvementsTickets);
  //     },
  //     error: (err) => {
  //       console.error("Erreur lors du chargement des mouvements :", err);
  //     }
  //   });
  // }
  loadAllSortieTicketWhereNotInRetour(): void {
    this.retourTicketService.getAllSortieTicketWhereNotInRetour().subscribe({
        next: (allMouvements: any[]) => {
            console.log("Liste des mouvements reçus (avec ID uniques, mais la même référence) :", allMouvements);

            // 1. DÉDUPLICATION FRONTEND: Utiliser la PROPRIÉTÉ 'reference' comme clé unique
            const uniqueMouvementsMap = new Map();

            allMouvements.forEach((mouvement: any) => {
                // 💡 CLÉ DE DÉDUPLICATION CHANGÉE : Nous utilisons mouvement.reference
                if (mouvement.reference && !uniqueMouvementsMap.has(mouvement.reference)) {
                    uniqueMouvementsMap.set(mouvement.reference, mouvement);
                }
            });

            // 2. Convertir la Map en tableau et assigner à this.mouvementsTickets
            this.mouvementsTickets = Array.from(uniqueMouvementsMap.values());

            // Note: Le ng-select affichera la référence, et chaque élément sera unique.
            console.log("Liste des mouvements dédupliqués (par RÉFÉRENCE unique) :", this.mouvementsTickets);
        },
        error: (err) => {
            console.error("Erreur lors du chargement des mouvements :", err);
        }
    });
  }
  loadCouponTickets(): void {
    this.retourTicketService.getAllCouponTickets().subscribe({
      next: (data) => {
        this.couponsTickets = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des coupons tickets :", err);
      }
    });
  }
  loadCompagniePetrolieres(): void {
    this.retourTicketService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagnies Petrolieres :", err);
      }
    });
  }

  loadRetourTickets(): void {
    this.retourTicketService.getAllRetourTickets().subscribe(
      (data: RetourTicket[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Retours Tickets', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(retourTicket =>
  //     retourTicket.created_at.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(retourTicket =>
      (retourTicket.mouvementTicket && retourTicket.mouvementTicket.reference && retourTicket.mouvementTicket.reference.toLowerCase().includes(val)) ||
      (retourTicket.coupon_ticket && retourTicket.coupon_ticket.libelle && retourTicket.coupon_ticket.libelle.toLowerCase().includes(val)) ||
      (retourTicket.compagnie_petrolier && retourTicket.compagnie_petrolier.libelle && retourTicket.compagnie_petrolier.libelle.toLowerCase().includes(val)) ||
      (retourTicket.qte && String(retourTicket.qte).toLowerCase().includes(val))
    );

    // Important : réinitialiser l'offset de la table pour afficher les résultats filtrés depuis le début
    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editRetourTicket.patchValue({
      id: row.id,
      mouvementTicket_id: row.mouvementTicket_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      qte: row.qte,
    })
  }

  getDeleteForm(row: any) {
    this.deleteRetourTicket.patchValue({
      id: row.id,
    })
  }

  get retoursCouponsArray(): FormArray {
    // Note : Le nom du FormArray dans ngOnInit sera 'retours_coupons'
    return this.addRetourTicket.get('retours_coupons') as FormArray;
}

  // getMouvementtInfo() {
  //   const idMouvement = this.addRetourTicket.get('mouvementTicket_id')?.value;
  //   console.log('ID du Mouvement sélectionné:', idMouvement);
  //   if (!idMouvement) {
  //     console.log('Aucun Mouvement sélectionné ou désélection effectuée');
  //     return;
  //   }
  //   this.retourTicketService.getMouvementInfo(idMouvement).subscribe(
  //     (response) => {
  //       console.log('Info Récupérée:', response);
  //       this.addRetourTicket.patchValue({
  //         compagnie_petrolier_id: response.compagnie_petrolier_id,
  //         coupon_ticket_id: response.coupon_ticket_id
  //       });
  //       this.ancienQteDuMvt = response.quantite; // Assuming 'quantite' is the property holding the max quantity
  //       const qteControl = this.addRetourTicket.get('qte');
  //       qteControl?.setValidators([
  //         Validators.required,
  //         Validators.min(1),
  //         Validators.max(this.ancienQteDuMvt)
  //       ]);
  //       qteControl?.updateValueAndValidity();
  //     },
  //     (error) => {
  //       console.error('Erreur lors des Infos:', error);
  //     }
  //   );
  // }

    getMouvementtInfo() { //Nouveau
      const idMouvement = this.addRetourTicket.get('mouvementTicket_id')?.value;
      console.log('ID du Mouvement sélectionné:', idMouvement);

      // 1. Vider le FormArray et la compagnie
      while (this.retoursCouponsArray.length !== 0) {
          this.retoursCouponsArray.removeAt(0);
      }
      this.addRetourTicket.patchValue({ compagnie_petrolier_id: null });

      if (!idMouvement) {
        console.log('Aucun Mouvement sélectionné ou désélection effectuée');
        return;
      }

      this.retourTicketService.getMouvementInfo(idMouvement).subscribe(
        (response: any) => { // response doit contenir 'coupons_details'
          console.log('Info Récupérée:', response);

          // 2. Remplir le champ principal Compagnie
          this.addRetourTicket.patchValue({
            compagnie_petrolier_id: response.compagnie_petrolier_id
          });

          // 3. Populer le FormArray
          if (response.coupons_details && Array.isArray(response.coupons_details)) {
              response.coupons_details.forEach((coupon: any) => {
                  this.retoursCouponsArray.push(this.createCouponReturnFormGroup(coupon));
              });
          }

          if (this.retoursCouponsArray.length === 0) {
              alert("Tous les coupons de cette sortie ont déjà été retournés, ou il n'y a pas de coupon à retourner.");
          }
        },
        (error: any) => {
                    console.error('Erreur lors de la récupération des infos du mouvement:', error);
                    this.addRetourTicket.patchValue({ compagnie_petrolier_id: null });
                    
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier votre connexion et recharger la page.';
          
                    if (error.status === 404) {
                      // Mouvement introuvable
                      detail = 'Le mouvement de ticket sélectionné est introuvable. Il a peut-être été supprimé ou l\'ID est incorrect.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour consulter cette information.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Impossible de communiquer avec le serveur pour récupérer les détails du mouvement.';
                    } else if (error.error && (error.error.message || error.error.error)) {
                      // Message d'erreur général du serveur
                      detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                    }
          
                    // Message final clair
                    alert(`Échec de la récupération des détails du mouvement pour le retour de ticket.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
                  }
                );
    }

    loadMouvementsTickets() {
      this.retourTicketService.getMouvementsDisponibles().subscribe(
        (data) => {
          this.mouvementsTickets = data;
        },
        (err) => console.error(err)
      );
    }

}
