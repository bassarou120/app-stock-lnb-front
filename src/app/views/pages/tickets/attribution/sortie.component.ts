import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementTicketService } from '../../../../core/services/mouvement-ticket/sortie.service';
import { Employe, TypeMouvement, CompagniePetroliere, Vehicule, CouponTicket, MouvementTicket, Commune } from '../../../../core/services/interface/models';
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
  selector: 'app-sortie',
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
  templateUrl: 'sortie.component.html'
})
export class SortieComponent implements OnInit {

  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddAttribution: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  // canModifyAttribution: boolean = true;
  // canDeleteAttribution: boolean = true;
  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementTicket[] = [];
  temp: MouvementTicket[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  type_mouvements: TypeMouvement[] = []; // Liste des mouvements
  compagniePetrolieres: CompagniePetroliere[] = []; // Liste des compagnies
  vehicules: Vehicule[] = []; // Liste des vehicules
  couponTickets: CouponTicket[] = []; // Liste des coupons
  employes: Employe[] = []; // Liste des Employe

  couponTicketsWithCompagnies: any[] = [];
  selectedCouponTicket: any = null;


  quantiteDisponible: number = 0;
  coupon_ticket_id: number = 0;
  compagnie_petrolier_id: number = 0;


  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addSortie!: FormGroup;
  public editSortie!: FormGroup;
  public deleteSortie!: FormGroup;

  communes: Commune[] = []; // Liste des communes

  // NOUVELLE PROPRIÉTÉ POUR GÉRER L'ÉTAT DE SOUMISSION D'AJOUT
  isAddingSortie: boolean = false;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private sortieService: MouvementTicketService, private formBuilder: FormBuilder,private router: Router) { }


  ngOnInit(): void {
    this.initializePermissions();
    if (this.hasPageAccess) {
    this.loadCommunes();
    this.loadTypeMouvements();
    this.loadCompagniePetrolieres()
    this.loadCouponTicketsWithCompagnies();
    this.loadEmployes();
    this.loadVehicules();
    this.loadSorties();
    }
    this.addSortie = this.formBuilder.group({
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0)
      employe_id: [null, [Validators.required]], // Rendu requis si l'employé est toujours obligatoire
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required, Validators.min(1)]], // Ajout d'un validateur min(1)
      date: ["", [Validators.required]],
      trajet_aller_retour: [false, []],
    });
    this.editSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
      // id_type_mouvements: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0)
      employe_id: [null, []],
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required, Validators.min(1)]], // Ajout d'un validateur min(1)
      date: ["", [Validators.required]],
      trajet_aller_retour: [false, []],
    });
    this.deleteSortie = this.formBuilder.group({
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
      this.canAddAttribution = allowedFonctionnalites.includes('Attribution ticket');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canAddAttribution ;


      console.log('🔐 Permissions calculées:', {
        canAddAttribution: this.canAddAttribution,
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

  onClickSubmitAddSortie() {
    // console.log('onClickSubmitAddSortie appelé. isAddingSortie:', this.isAddingSortie); // Commenté

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingSortie) {
      // console.warn('Soumission multiple détectée pour Sortie. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-sortie'); // Assurez-vous que ce sélecteur correspond à votre HTML

    if (this.addSortie.valid) {
      this.isAddingSortie = true; // Désactiver le bouton
      // console.log('isAddingSortie mis à true.'); // Commenté

      if (spinner) {
        spinner.classList.remove('d-none');
        // console.log('Spinner Sortie affiché.'); // Commenté
      }

      const formData = {
        ...this.addSortie.value,
        date: this.formatDate(this.addSortie.value.date), // Convertir la date
      };
      this.sortieService.saveMouvementTicketSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.addSortie.reset();
          this.isAddingSortie = false; // Réactiver le bouton
          // console.log('Soumission Sortie réussie. isAddingSortie mis à false.'); // Commenté


          // Fermer le modal manuellement
          const modal = document.getElementById('add_sortie');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de la sortie :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingSortie = false; // Réactiver le bouton en cas d'erreur
          // console.error('Soumission Sortie échouée. isAddingSortie mis à false.'); // Commenté
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      // console.log("Erreurs du formulaire :", this.addSortie.errors); // Commenté
      // console.log("Statut des champs :", this.addSortie.controls); // Commenté
      this.markFormGroupTouched(this.addSortie); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClickSubmitEditSortie() {
    console.log(this.editSortie.value);
    const spinner = document.querySelector('.spinnerModif');

    // NOTE: Il serait bon d'ajouter une propriété isEditingSortie: boolean = false;
    // et de la gérer comme isAddingSortie.
    if (this.editSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      // const id = this.editSortie.value.id; // Non utilisé
      const formData = {
        ...this.editSortie.value,
        date: this.formatDate(this.editSortie.value.date), // Convertir la date
      };
      this.sortieService.editMouvementTicketSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.editSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_sortie');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertModifVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la modification de la sortie :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.editSortie); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteSortie() {
    console.log(this.deleteSortie.value);
    const spinner = document.querySelector('.spinnerDelete');

    // NOTE: Il serait bon d'ajouter une propriété isDeletingSortie: boolean = false;
    // et de la gérer comme isAddingSortie.
    if (this.deleteSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.sortieService.deleteMouvementTicketSortie(this.deleteSortie.value).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.deleteSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_sortie');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertSuppVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la supression de la sortie :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadVehicules(): void {
    this.sortieService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data; // Stocker la liste des vehicules
      },
      error: (err) => {
        console.error("Erreur lors du chargement des véhicules :", err);
      }
    });
  }
  loadEmployes(): void {
    this.sortieService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data.map((employe: any) => ({
          ...employe,
          fullName: `${employe.nom} ${employe.prenom}`
        })); // Ajouter fullName pour l'affichage
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }

  loadCommunes(): void {
    this.sortieService.getAllCommunes().subscribe({ // Assurez-vous que cette méthode existe dans TrajetsService
      next: (data) => {
        this.communes = data; // Stocker la liste des communes
        // console.log('Communes chargées :', this.communes); // Commenté
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
      }
    });
  }

  loadTypeMouvements(): void {
    this.sortieService.getAllTypeMouvement().subscribe({
      next: (data) => {
        this.type_mouvements = data; // Stocker la liste des couponTickets
      },
      error: (err) => {
        console.error("Erreur lors du chargement des couponTickets :", err);
      }
    });
  }

  loadCompagniePetrolieres(): void {
    this.sortieService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data; // Stocker la liste des compagnies Petrolieres
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagnies Petrolieres :", err);
      }
    });
  }

  loadCouponTicketsWithCompagnies(): void {
    this.sortieService.getCouponTicketsWithCompagnies().subscribe({
      next: (res) => {
        if (res.success) {
          this.couponTicketsWithCompagnies = res.data
          .filter((item: any) => item.coupon_ticket && item.compagnie)
          .map((item: any) => {
            const coupon = item.coupon_ticket;
            const compagnie = item.compagnie;
            return {
              id: item.coupon_ticket.id,
              displayLabel: `${item.coupon_ticket.libelle ?? ''} (${item.compagnie.libelle ?? ''})`,
              coupon_ticket_id: coupon?.id ?? null,
              compagnie_petrolier_id: compagnie?.id ?? null
            };
          });
          // console.log("Bonjour", this.couponTicketsWithCompagnies); // Commenté
        }
      },
      error: (err) => {
        console.error("Erreur lors du chargement des coupons :", err);
      }
    });
  }

  loadSorties(): void {
    this.sortieService.getAllMouvementTicketSortie().subscribe(
      (data: MouvementTicket[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Ticket Sortie', error); // Correction du message
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(sortie =>
      sortie.reference.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editSortie.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      compagnie_petrolier_id: row.compagnie_petrolier_id,
      coupon_ticket_id: row.coupon_ticket_id,
      kilometrage: row.kilometrage,
      employe_id: row.employe_id, // Utilisez employe_id directement
      commune_depart: row.commune_depart,
      commune_arriver: row.commune_arriver,
      description: row.description,
      qte: row.qte,
      objet: row.objet,
      date: this.convertToNgbDate(row.date),
    })
  }

  getDeleteForm(row: any) {
    this.deleteSortie.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format CCYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer CCYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  formatEmploye(employe: any): string {
    return employe ? `${employe.nom} ${employe.prenom}` : '';
  }

  updateQuantiteDisponible() {
    const idCoupon = this.addSortie.get('coupon_ticket_id')?.value;
    const idCompagnie = this.addSortie.get('compagnie_petrolier_id')?.value;
    // console.log('ID du coupon sélectionné:', idCoupon); // Commenté

    if (!idCoupon) {
      // console.log('Aucun article sélectionné ou désélection effectuée'); // Commenté
      this.quantiteDisponible = 0;
      return;
    }

    this.sortieService.getQuantiteDisponible(idCoupon, idCompagnie).subscribe(
      (response) => {
        // console.log('Quantité disponible:', response.data); // Commenté
        this.quantiteDisponible = response.data;

        // 🔥 On met à jour le validateur max du champ qte
        const qteControl = this.addSortie.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();

      },
      (error) => {
        console.error('Erreur lors de la récupération de la quantité disponible:', error);
        this.quantiteDisponible = 0;
      }
    );

  }

  onCouponSelected(event: any): void {
    if (event) {
      this.coupon_ticket_id = event.coupon_ticket_id;
      this.compagnie_petrolier_id = event.compagnie_petrolier_id;

      // console.log('Coupon ID:', this.coupon_ticket_id); // Commenté
      // console.log('Compagnie ID:', this.compagnie_petrolier_id); // Commenté

      this.addSortie.patchValue({
        coupon_ticket_id: this.coupon_ticket_id,
        compagnie_petrolier_id: this.compagnie_petrolier_id
      });
      this.updateQuantiteDisponible();

    }
  }

  // NOTE : Si `calculerQuantiteTicket` met à jour `qte`, assurez-vous qu'elle est appelée APRÈS
  // que `updateQuantiteDisponible` ait mis à jour les validateurs, ou adaptez la logique.
  // Idéalement, `calculerQuantiteTicket` devrait aussi mettre à jour les validateurs de `qte` si la quantité calculée dépasse la quantité disponible.
  calculerQuantiteTicket() {
    const data = {
      commune_depart: this.addSortie.get('commune_depart')?.value,
      commune_arriver: this.addSortie.get('commune_arriver')?.value,
      trajet_aller_retour: this.addSortie.get('trajet_aller_retour')?.value,
      coupon_ticket_id: this.addSortie.get('coupon_ticket_id')?.value,
    };

    // Vérifier si toutes les données nécessaires sont présentes
    if (!data.commune_depart || !data.commune_arriver || !data.coupon_ticket_id) {
      // console.warn('Données manquantes pour calculer la quantité de ticket.'); // Commenté
      return;
    }

    // Appelle le service
    this.sortieService.getQuantiteTicketAttribution(data).subscribe({
      next: (res) => {
        const qteCalculee = res.qteTicket;
        const qteControl = this.addSortie.get('qte');

        // Appliquer la quantité calculée seulement si elle ne dépasse pas la quantité disponible
        if (qteCalculee <= this.quantiteDisponible) {
          this.addSortie.patchValue({ qte: qteCalculee });
          // console.log('Quantité de ticket calculée et appliquée:', qteCalculee); // Commenté
        } else {
          // Si la quantité calculée dépasse la disponible, alerter l'utilisateur ou ajuster
          alert(`La quantité calculée (${qteCalculee}) dépasse la quantité disponible (${this.quantiteDisponible}).`);
          this.addSortie.patchValue({ qte: this.quantiteDisponible }); // Ou laisser vide, ou mettre 1
          // console.warn('Quantité calculée trop élevée, ajustée à la quantité disponible.'); // Commenté
        }

        // Il est crucial de mettre à jour les validateurs après toute modification de la quantité disponible ou calculée
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible) // Toujours baser sur la quantité disponible réelle
        ]);
        qteControl?.updateValueAndValidity();
      },
      error: (err) => {
        console.error('Erreur de calcul de ticket', err);
        alert('Une erreur est survenue lors du calcul de la quantité de ticket. Veuillez réessayer.');
      },
    });
  }
}
