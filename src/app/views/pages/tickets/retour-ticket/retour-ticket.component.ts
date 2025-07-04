import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { RetourTicketService } from '../../../../core/services/retour-ticket/retour-ticket.service';
import { RetourTicket, CompagniePetroliere, MouvementTicket, CouponTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
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
  templateUrl: 'retour-ticket.component.html'
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
    }

    this.addRetourTicket = this.formBuilder.group({
      mouvementTicket_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      qte: [1, [Validators.required]],
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

    // 2. Valider le formulaire
    if (this.addRetourTicket.invalid) {
      this.markFormGroupTouched(this.addRetourTicket); // Marque les champs pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires et la quantité.");
      return; // Bloque la soumission si le formulaire est invalide
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    console.log(this.addRetourTicket.value);

    this.retourTicketService.saveRetourTicket(this.addRetourTicket.value).subscribe(
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
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
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
        alert('Une erreur s\'est produite. Veuillez réessayer.');
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
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    );
  }

  loadAllSortieTicketWhereNotInRetour(): void {
    this.retourTicketService.getAllSortieTicketWhereNotInRetour().subscribe({
      next: (data) => {
        this.mouvementsTickets = data;
        console.error(" voici la liste", this.mouvementsTickets);
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

  getMouvementtInfo() {
    const idMouvement = this.addRetourTicket.get('mouvementTicket_id')?.value;
    console.log('ID du Mouvement sélectionné:', idMouvement);
    if (!idMouvement) {
      console.log('Aucun Mouvement sélectionné ou désélection effectuée');
      return;
    }
    this.retourTicketService.getMouvementInfo(idMouvement).subscribe(
      (response) => {
        console.log('Info Récupérée:', response);
        this.addRetourTicket.patchValue({
          compagnie_petrolier_id: response.compagnie_petrolier_id,
          coupon_ticket_id: response.coupon_ticket_id
        });
        this.ancienQteDuMvt = response.quantite; // Assuming 'quantite' is the property holding the max quantity
        const qteControl = this.addRetourTicket.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.ancienQteDuMvt)
        ]);
        qteControl?.updateValueAndValidity();
      },
      (error) => {
        console.error('Erreur lors des Infos:', error);
      }
    );
  }
}
