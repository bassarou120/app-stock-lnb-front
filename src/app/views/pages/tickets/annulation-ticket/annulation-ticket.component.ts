import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { AnnulationTicketService } from '../../../../core/services/annulation-ticket/annulation-ticket.service';
import { AnnulationTicket, CompagniePetroliere, MouvementTicket, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-annulation-ticket',
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
  templateUrl: 'annulation-ticket.component.html'
})
export class AnnulationTicketComponent implements OnInit {

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirTicketAnnuler: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres
  canAddAnnulationTicket: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages Voir Parametres

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages 

  rows: AnnulationTicket[] = [];
  temp: AnnulationTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  mouvementsTickets: MouvementTicket[] = []; // Liste des mouvements de sortie non annulés
  couponsTickets: CouponTicket[] = []; // Liste des coupons ticket
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  ancienQteDuMvt: number; // Stocke la quantité d'origine du mouvement pour la validation

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -------------------------------------------------
  detailsMouvementSelectionne: any[] = [];
  libelleCouponSelectionne: string = ''

  public addAnnulationTicket!: FormGroup;
  public editAnnulationTicket!: FormGroup;
  public deleteAnnulationTicket!: FormGroup;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private annulationTicketService: AnnulationTicketService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    this.loadAllSortieTicketWhereNotInAnnulation();
    this.loadAnnulationTickets();
    this.loadCompagniePetrolieres();
    this.loadCouponTickets();

    this.addAnnulationTicket = this.formBuilder.group({
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
    });
    this.editAnnulationTicket = this.formBuilder.group({
      id: [0, [Validators.required]],
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
    });
    this.deleteAnnulationTicket = this.formBuilder.group({
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
      this.canVoirTicketAnnuler = allowedFonctionnalites.includes('Voir Annulation Ticket');
      this.canAddAnnulationTicket = allowedFonctionnalites.includes('Ajout Annulation Ticket');


      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirTicketAnnuler || this.canAddAnnulationTicket;

      console.log('🔐 Permissions calculées:', {
        canVoirTicketAnnuler: this.canVoirTicketAnnuler,
        canAddAnnulationTicket: this.canAddAnnulationTicket,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à l\'annulation de ticket');
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
  // -----------------------------------------------------------

  onClickSubmitAddAnnulationTicket() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout d\'annulation de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.addAnnulationTicket.invalid) {
      this.markFormGroupTouched(this.addAnnulationTicket); // Marque les champs pour afficher les erreurs de validation
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    console.log(this.addAnnulationTicket.value);

    this.annulationTicketService.saveAnnulationTickett(this.addAnnulationTicket.value).subscribe(
      (data: any) => {
        this.loadAnnulationTickets();
        this.loadAllSortieTicketWhereNotInAnnulation(); // Recharger les mouvements disponibles
        
        // --- MODIFICATION ICI : Remise à zéro complète ---
        this.addAnnulationTicket.reset();
        this.detailsMouvementSelectionne = []; // Vide le tableau des coupons
        this.libelleCouponSelectionne = '';      // Vide le libellé d'affichage
        this.ancienQteDuMvt = 0;                // Remet le compteur à zéro
        // ------------------------------------------------

        const modal = document.getElementById('add_annulation');
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
                console.error('Erreur lors de l\'ajout de l\'annulation du ticket :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isAdding = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier les informations (ticket sélectionné, raison) et réessayer.';
        
                if (error.status === 422 || error.status === 400) {
                  // Erreur de validation (ticket manquant, règles métier, quantité annulée)
                  detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. le ticket sélectionné ne peut plus être annulé ou la raison est manquante).';
                  
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
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour enregistrer cette annulation.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Impossible de communiquer avec le serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && (error.error.error || error.error.message)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                Swal.fire({
                  title: 'Erreur',
                  text: `L'enregistrement de l'annulation de ticket a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`,
                  icon: 'error',
                  confirmButtonText: 'Réessayer',
                  confirmButtonColor: '#d33'
                });
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' de l'observable
        this.isAdding = false;
      }
    );
}

  onClickSubmitEditAnnulationTicket() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification d\'annulation de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.editAnnulationTicket.invalid) {
      this.markFormGroupTouched(this.editAnnulationTicket);
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    console.log(this.editAnnulationTicket.value);

    const id = this.editAnnulationTicket.value.id;
    this.annulationTicketService.editAnnulationTicket(this.editAnnulationTicket.value).subscribe(
      (data: any) => {
        this.loadAnnulationTickets();
        this.loadAllSortieTicketWhereNotInAnnulation(); // Recharger les mouvements disponibles
        this.editAnnulationTicket.reset();

        const modal = document.getElementById('edit_annulationTicket');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertModifVisible = true;
          setTimeout(() => {
            this.alertModifVisible = false;
          }, 2000);
        }, 200);
      },
      (error: any) => {
                console.error('Erreur lors de la modification de l\'annulation du ticket:', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isEditing = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier les informations de modification et réessayer.';
        
                if (error.status === 422 || error.status === 400) {
                  // Erreur de validation (champs obligatoires, règles métier, etc.)
                  detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. le ticket sélectionné est invalide ou la raison est manquante).';
                  
                  // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                  if (error.error && (error.error.error || error.error.message)) {
                    const serverMessage = error.error.error || error.error.message;
                    detail = `Erreur de Validation : ${serverMessage}`;
                  }
                } else if (error.status === 404) {
                  // Annulation introuvable
                  detail = 'L\'annulation de ticket que vous tentez de modifier est introuvable. Elle a peut-être été supprimée par un autre utilisateur.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier cette annulation.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Impossible de communiquer avec le serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && (error.error.error || error.error.message)) {
                  // Message d'erreur général du serveur
                  detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                }
        
                // Message final clair
                Swal.fire({
                  title: 'Erreur',
                  text: `La modification de l'annulation de ticket a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`,
                  icon: 'error',
                  confirmButtonText: 'Réessayer',
                  confirmButtonColor: '#d33'
                });
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' de l'observable
        this.isEditing = false;
      }
    );
  }

  onClickSubmitDeleteAnnulationTicket() {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression d\'annulation de ticket déjà en cours. Opération annulée.');
      return;
    }

    // 2. Valider le formulaire
    if (this.deleteAnnulationTicket.invalid) {
      this.markFormGroupTouched(this.deleteAnnulationTicket);
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné.',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    console.log(this.deleteAnnulationTicket.value);

    this.annulationTicketService.deleteAnnulationTicket(this.deleteAnnulationTicket.value).subscribe(
      (data: any) => {
        this.loadAnnulationTickets();
        this.loadAllSortieTicketWhereNotInAnnulation(); // Recharger les mouvements disponibles
        this.deleteAnnulationTicket.reset();

        const modal = document.getElementById('delete_annulation');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertSuppVisible = true;
          setTimeout(() => {
            this.alertSuppVisible = false;
          }, 2000);
        }, 200);
      },
      (error: any) => {
                console.error('Erreur lors de la suppression de l\'annulation du ticket :', error);
                
                // Débloquer l'interface utilisateur immédiatement
                this.isDeleting = false;
                
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez réessayer l\'opération. Si l\'erreur persiste, contactez le support.';
        
                if (error.status === 404) {
                  // Erreur 404 si l'annulation à supprimer n'est plus trouvée
                  detail = 'L\'annulation de ticket sélectionnée est introuvable. Elle a peut-être déjà été supprimée par un autre utilisateur.';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Accès refusé. Vous n\'avez pas les permissions pour supprimer cette annulation.';
                } else if (error.status === 422 || error.status === 400) {
                  // Erreur de validation/règles métier (ex: l'annulation est bloquée)
                  detail = 'La suppression est impossible. Une règle métier bloque cette opération (ex: l\'entrée de stock est ré-utilisée).';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                } else if (error.error && (error.error.message || error.error.error)) {
                  // Tente d'afficher le message d'erreur spécifique du serveur
                  const serverMessage = error.error.message || error.error.error;
                  detail = `Raison : ${serverMessage}. L'annulation n'a pas pu être supprimée.`;
                }
        
                // Message final clair
                Swal.fire({
                  title: 'Erreur',
                  text: `La suppression de l'annulation de ticket a échoué.\n\nDétails : ${detail}\n\nEn cas d'échec répété, veuillez contacter le support technique.`,
                  icon: 'error',
                  confirmButtonText: 'Réessayer',
                  confirmButtonColor: '#d33'
                });
              },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' de l'observable
        this.isDeleting = false;
      }
    );
  }

  loadAllSortieTicketWhereNotInAnnulation(): void {
    this.annulationTicketService.getAllSortieTicketWhereNotInAnnulation().subscribe({
      next: (res: any) => {
        // 1. On récupère les données
        const dataRaw = (res.data || res) as any[];
  
        // 2. Filtrage pour ne garder que des références UNIQUES
        // On ajoute "as MouvementTicket[]" à la fin pour rassurer TypeScript
        const uniqueMouvements = [
          ...new Map(dataRaw.map((item: any) => [item['reference'], item])).values()
        ] as MouvementTicket[]; 
  
        // 3. L'assignation fonctionnera sans erreur maintenant
        this.mouvementsTickets = uniqueMouvements;
        
        console.log("Mouvements uniques chargés :", this.mouvementsTickets);
      },
      error: (err) => {
        console.error("Erreur lors du chargement :", err);
      }
    });
}

  loadAnnulationTickets(): void {
    this.annulationTicketService.getAllAnnulationTicket().subscribe(
      (data: AnnulationTicket[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des annulations de tickets', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(annulationTicket =>
  //     annulationTicket.created_at.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(annulationTicket =>
      (annulationTicket.mouvementTicket && annulationTicket.mouvementTicket.reference && annulationTicket.mouvementTicket.reference.toLowerCase().includes(val)) ||
      (annulationTicket.coupon_ticket && annulationTicket.coupon_ticket.libelle && annulationTicket.coupon_ticket.libelle.toLowerCase().includes(val)) ||
      (annulationTicket.compagnie_petrolier && annulationTicket.compagnie_petrolier.libelle && annulationTicket.compagnie_petrolier.libelle.toLowerCase().includes(val)) ||
      (annulationTicket.qte && String(annulationTicket.qte).toLowerCase().includes(val))
    );
    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editAnnulationTicket.patchValue({
      id: row.id,
      mouvementTicket_id: row.mouvementTicket_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      qte: row.qte,
    });
  }

  getDeleteForm(row: any) {
    this.deleteAnnulationTicket.patchValue({
      id: row.id,
    });
  }

  loadCouponTickets(): void {
    this.annulationTicketService.getAllCouponTickets().subscribe({
      next: (data) => {
        this.couponsTickets = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des coupons tickets :", err);
      }
    });
  }

  loadCompagniePetrolieres(): void {
    this.annulationTicketService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagnies Petrolieres :", err);
      }
    });
  }

  getMouvementInfo(mouvementSelected: any) {
    // 1. Si on vide la sélection
    if (!mouvementSelected) {
      this.detailsMouvementSelectionne = [];
      this.addAnnulationTicket.reset();
      return;
    }
  
    // 2. On récupère la référence (ex: MVT-445205522)
    const ref = mouvementSelected.reference;
  
    // 3. On appelle le backend pour avoir tous les coupons de cette référence
    this.annulationTicketService.getDetailsMouvementParReference(ref).subscribe({
      next: (data) => {
        // On stocke les lignes trouvées dans notre tableau
        this.detailsMouvementSelectionne = data;
        
        if (this.detailsMouvementSelectionne.length === 0) {
          Swal.fire('Info', 'Tous les coupons de ce mouvement sont déjà annulés.', 'info');
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        Swal.fire('Erreur', 'Impossible de récupérer les détails du mouvement.', 'error');
      }
    });
  }

  resetLocalData() {
    this.detailsMouvementSelectionne = [];
    this.libelleCouponSelectionne = '';
    this.addAnnulationTicket.reset();
}
  // Fonction pour remplir le formulaire quand on clique sur "Choisir" dans le tableau
selectionnerLigne(item: any) {
  this.addAnnulationTicket.patchValue({
      mouvementTicket_id: item.id, // L'ID unique de la ligne
      compagnie_petrolier_id: item.compagnie_petrolier?.id,
      coupon_ticket_id: item.coupon_ticket?.id,
      qte: item.qte
  });
  this.libelleCouponSelectionne = item.coupon_ticket?.libelle;
  this.ancienQteDuMvt = item.qte;
}
}