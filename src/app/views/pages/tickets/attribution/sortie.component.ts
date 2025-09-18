import { Component, ViewChild, OnInit, inject,TemplateRef, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementTicketService } from '../../../../core/services/mouvement-ticket/sortie.service';
import { Employe, TypeMouvement, CompagniePetroliere, Vehicule, CouponTicket, MouvementTicket, Commune,TicketDetail,TransactionSortie,CategorieSortieTicket } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { CategorieSortieTicketService } from '../../../../core/services/categorie-sortie-ticket/categorie-sortie-ticket.service';

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
  templateUrl: 'sortie.component.html',
  styleUrls: ['sortie.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SortieComponent implements OnInit {

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddAttribution: boolean = true;
  hasPageAccess: boolean = true;

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  // rows: MouvementTicket[] = [];
  // temp: MouvementTicket[] = [];

  rows: TransactionSortie[] = [];
  temp: TransactionSortie[] = [];
  selectedSortie!: TransactionSortie; // Pour le modal

  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  type_mouvements: TypeMouvement[] = [];
  compagniePetrolieres: CompagniePetroliere[] = [];
  vehicules: Vehicule[] = [];
  couponTickets: CouponTicket[] = [];
  employes: Employe[] = [];

  couponTicketsWithCompagnies: any[] = [];
  selectedCouponTicket: any = null;
  selectedSortieb: any = null;

  quantiteDisponible: number = 0;
  coupon_ticket_id: number = 0;
  compagnie_petrolier_id: number = 0;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addSortie!: FormGroup;
  public editSortie!: FormGroup;
  public deleteSortie!: FormGroup;
  public addKilometrageFin!: FormGroup;

  // Nouvelle propriété pour le message de trajet non trouvé
  trajetNotFoundMessage: string | null = null;

  communes: Commune[] = [];
  categoriesSortie: CategorieSortieTicket[] = [];

  isAddingSortie: boolean = false;

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('addKilometrageFinContent') addKilometrageFinContent!: TemplateRef<any>;

  constructor(
    private sortieService: MouvementTicketService,
    private formBuilder: FormBuilder,
    private router: Router,
    private ngbModalService: NgbModal,
    public modalService: NgbModal,
     private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private categorieSortieTicketService: CategorieSortieTicketService
  ) { }


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
      this.loadCategoriesSortie();
    }

    // this.addSortie = this.formBuilder.group({
    //   compagnie_petrolier_id: [null, [Validators.required]],
    //   vehicule_id: [null, [Validators.required]],
    //   coupon_ticket_id: [null, [Validators.required]],
    //   kilometrage: [null, [ Validators.min(0)]],
    //   employe_id: [null, [Validators.required]],
    //   commune_depart: [null, []],
    //   commune_arriver: [null, []],
    //   description: ["", []],
    //   objet: ["", []],
    //   qte: [null, [Validators.required, Validators.min(1)]], // Initialisé à null pour permettre la saisie
    //   date: [this.currentDate, [Validators.required]],
    //   trajet_aller_retour: [false, []],
    // });

    this.addSortie = this.formBuilder.group({
    vehicule_id: [null, [Validators.required]],
    kilometrage: [null, [Validators.required, Validators.min(0)]],
    employe_id: [null, [Validators.required]],
    commune_depart: [null],
    commune_arriver: [null],
    description: [""],
    objet: [""],
    date: [this.currentDate, [Validators.required]],
    trajet_aller_retour: [false],
    id_categorie_sortie_ticket: ['', Validators.required],
    tickets: this.formBuilder.array([
      this.createTicketGroup()
    ])
  });

    this.editSortie = this.formBuilder.group({
      id: [null],
      compagnie_petrolier_id: [null],
      vehicule_id: [null],
      coupon_ticket_id: [null],
      kilometrage: [null],
      kilometrage_de_fin: [null, [ Validators.min(0)]],
      employe_id: [null],
      commune_depart: [null],
      commune_arriver: [null],
      description: ["", []],
      objet: ["", []],
      qte: [1, ],
      date: ["", ],
      trajet_aller_retour: [false, []],
      id_categorie_sortie_ticket: [null, Validators.required],
    });

    this.deleteSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    this.addKilometrageFin = this.formBuilder.group({
      id: [0, [Validators.required]],
      kilometrage_de_fin: [null, [ Validators.min(0)]],
    });


  }

    // raccourci
get tickets(): FormArray {
  return this.addSortie.get('tickets') as FormArray;
}

// un ticket
createTicketGroup(): FormGroup {
  return this.fb.group({
    coupon_ticket_id: [null, Validators.required],
    qte: [1, [Validators.required, Validators.min(1)]]
  });
}

addTicket(): void {
  this.tickets.push(this.createTicketGroup());
  this.cdRef.detectChanges();
  setTimeout(() => {
    this.cdRef.detectChanges(); // ✅ On force la détection de changement
  }, 0);
}

removeTicket(index: number): void {
  this.tickets.removeAt(index);
}

onQteInput(event: any, index: number) {
  const value = event.target.value;
  const ticketFormGroup = this.tickets.at(index) as FormGroup;
  const qteControl = ticketFormGroup.get('qte');

  if (qteControl) {
    // S'assurer que la valeur est un nombre entier et qu'elle est valide
    const qte = parseInt(value, 10);
    if (!isNaN(qte) && qte >= 1) {
      qteControl.setValue(qte);
    }
  }
}

  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return;
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      this.canAddAttribution = allowedFonctionnalites.includes('Attribution ticket');

      this.hasPageAccess = this.canAddAttribution;

      console.log('🔐 Permissions calculées:', {
        canAddAttribution: this.canAddAttribution,
      });

      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        this.router.navigate(['/error/403']);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
    }
  }

  // getViewForm(row: any) {
  //   if (!row || !row.id) {
  //     console.error('Données de sortie invalides:', row);
  //     return;
  //   }

  //   this.selectedSortie = row;
  // }

  getDaysSinceAttribution(dateAttribution: string): number {
    if (!dateAttribution) return 0;
    const attributionDate = new Date(dateAttribution);
    const today = new Date();
    const diffTime = today.getTime() - attributionDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateLitresPerTrajet(qteAttribue: number, nbreTrajet: number): number {
    if (!qteAttribue || !nbreTrajet || nbreTrajet === 0) return 0;
    return qteAttribue / nbreTrajet;
  }

  addKilometrageDeFin(row: any) {
    this.addKilometrageFin.patchValue({
      id: row.id,
    });
    this.modalService.open(this.addKilometrageFinContent, { centered: true });
  }

  onClickSubmitAddSortie() {
  if (this.isAddingSortie) {
    return;
  }


  // Marquer tous les contrôles comme touchés pour déclencher les validations
  this.markFormGroupTouched(this.addSortie);

  if (this.addSortie.valid) {
    this.isAddingSortie = true;
    const spinner = document.querySelector('.spinner-add-sortie');
    if (spinner) {
      spinner.classList.remove('d-none');
    }

    // Créer un objet de données basé sur les valeurs du formulaire
    const formData = {
      ...this.addSortie.value,
      date: this.formatDate(this.addSortie.value.date),
    };

    // Transformer le tableau de tickets du formulaire en un format compatible avec le backend
    const ticketsData = formData.tickets.map((ticket: any) => {
      // Trouver l'objet complet du coupon pour extraire les IDs réels
      const selectedItem = this.couponTicketsWithCompagnies.find(
        (item: any) => item.id === ticket.coupon_ticket_id
      );

      if (!selectedItem) {
        console.error("Erreur: Un coupon sélectionné n'a pas été trouvé.");
        alert("Erreur lors de la soumission: un coupon sélectionné est invalide.");
        this.isAddingSortie = false;
        if (spinner) {
          spinner.classList.add('d-none');
        }
        return null; // Retourne null pour pouvoir filtrer plus tard
      }

      return {
        compagnie_petrolier_id: selectedItem.compagnie_petrolier_actual_id,
        coupon_ticket_id: selectedItem.coupon_ticket_actual_id,
        qte: ticket.qte,
      };
    }).filter((ticket: any) => ticket !== null); // Supprimer les entrées nulles en cas d'erreur

    // Si une erreur a été détectée dans le tableau, arrêter la soumission
    if (ticketsData.length !== formData.tickets.length) {
      return;
    }

    // Remplacer l'objet de la requête par le tableau formaté
    formData.tickets = ticketsData;

    // Supprimer les propriétés inutiles qui ne sont plus envoyées au backend
    // Assurez-vous d'avoir un FormArray 'tickets' et non des champs séparés
    delete formData.coupon_ticket_id;
    delete formData.compagnie_petrolier_id;
    delete formData.qte;

    // Appel du service avec les données formatées
    this.sortieService.saveMouvementTicketSortie(formData).subscribe(
      (data: any) => {
        this.loadSorties();
        if (spinner) {
          spinner.classList.add('d-none');
        }
        this.addSortie.reset();
        this.isAddingSortie = false;
        // La réactivation des champs se fera automatiquement via la logique onCouponSelected
        this.trajetNotFoundMessage = null;

        const modal = document.getElementById('add_sortie');
        const bsModal = (window as any).bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertAjoutVisible = true;
          setTimeout(() => {
            this.alertAjoutVisible = false;
          }, 2000);
        }, 200);
      },
      (error: any) => {
        console.error('Erreur lors de l\'ajout de la sortie :', error);
        if (spinner) {
          spinner.classList.add('d-none');
        }
        this.isAddingSortie = false;
        alert('Une erreur s\'est produite. Veuillez réessayer. Détails: ' + (error.error?.message || error.message));
      }
    );
  } else {
    // Si le formulaire n'est pas valide
    const spinner = document.querySelector('.spinner-add-sortie');
    if (spinner) {
      spinner.classList.add('d-none');
    }
    alert("Désolé, le formulaire n'est pas bien renseigné. Veuillez vérifier les champs obligatoires et les quantités.");
  }
}
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClickSubmitEditSortie() {
    const spinner = document.querySelector('.spinnerModif');
    console.log("🔄 Début de la soumission d'édition");

    if (this.editSortie.valid) {
      console.log("✅ Formulaire valide :", this.editSortie.value);

      if (spinner) {
        spinner.classList.remove('d-none');
        console.log("⏳ Spinner affiché");
      }

      const compositeCouponId = this.editSortie.get('coupon_ticket_id')?.value;
      console.log("📌 Valeur du compositeCouponId :", compositeCouponId);

      let actualCouponId: number | null = null;
      let actualCompagnieId: number | null = null;

      if (compositeCouponId) {
        const selectedItem = this.couponTicketsWithCompagnies.find(
          item => item.id === compositeCouponId
        );
        console.log("🔍 Élément trouvé dans couponTicketsWithCompagnies :", selectedItem);

        if (selectedItem) {
          actualCouponId = selectedItem.coupon_ticket_actual_id;
          actualCompagnieId = selectedItem.compagnie_petrolier_actual_id;
          console.log("✅ IDs réels => coupon:", actualCouponId, "compagnie:", actualCompagnieId);
        } else {
          console.error("❌ Erreur: Élément introuvable dans couponTicketsWithCompagnies !");
          alert("Erreur lors de la soumission: Coupon sélectionné invalide pour l'édition.");
          if (spinner) {
            spinner.classList.add('d-none');
            console.log("⏹️ Spinner caché (erreur coupon introuvable)");
          }
          return;
        }
      } else {
        console.warn("⚠️ Aucun compositeCouponId trouvé, passage des IDs à null");
      }

      const formData = {
        ...this.editSortie.value,
        coupon_ticket_id: actualCouponId,
        compagnie_petrolier_id: actualCompagnieId,
        date: this.formatDate(this.editSortie.value.date),
      };

      // 💡 Récupérer l'ID de la sortie du formulaire
      const sortieId = formData.id;
      console.log("🔑 ID de la sortie pour l'édition :", sortieId);

      if (sortieId === null || sortieId === undefined) {
        console.error("❌ Erreur: ID de sortie non défini. Arrêt de la requête.");
        alert("Impossible de modifier, l'identifiant de la sortie est manquant.");
        if (spinner) {
          spinner.classList.add('d-none');
        }
        return;
      }

      console.log("📤 Données envoyées au backend :", formData);

      // 🚀 Passer l'ID comme premier argument à la méthode du service
      this.sortieService.editMouvementTicketSortie(sortieId, formData).subscribe(
        (data: any) => {
          console.log("✅ Réponse succès API :", data);
          this.loadSorties();
          if (spinner) {
            spinner.classList.add('d-none');
            console.log("⏹️ Spinner caché (succès)");
          }
          this.editSortie.reset();
          console.log("🧹 Formulaire réinitialisé après modification");

          const modal = document.getElementById('edit_sortie');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();
          console.log("📌 Modal 'edit_sortie' fermé");

          setTimeout(() => {
            this.alertModifVisible = true;
            console.log("🔔 Alerte modification affichée");
            setTimeout(() => {
              this.alertModifVisible = false;
              console.log("🔕 Alerte modification masquée");
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error("❌ Erreur API lors de la modification :", error);
          if (spinner) {
            spinner.classList.add('d-none');
            console.log("⏹️ Spinner caché (erreur API)");
          }
          alert("Une erreur s'est produite. Veuillez réessayer.");
        }
      );
    } else {
      console.warn("⚠️ Formulaire invalide :", this.editSortie.value);
      // 🔎 Ajout du détail champ par champ
      Object.keys(this.editSortie.controls).forEach(key => {
        const control = this.editSortie.get(key);
        console.log(
          `Champ ${key}: valeur=`, control?.value,
          " valid=", control?.valid,
          " errors=", control?.errors
        );
      });
      if (spinner) {
        spinner.classList.add('d-none');
        console.log("⏹️ Spinner caché (formulaire invalide)");
      }
      this.markFormGroupTouched(this.editSortie);
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }


  onClickSubmitDeleteSortie() {
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteSortie.valid) {
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      this.sortieService.deleteMouvementTicketSortie(this.deleteSortie.value).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) {
            spinner.classList.add('d-none');
          }
          this.deleteSortie.reset();

          const modal = document.getElementById('delete_sortie');
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
          console.error('Erreur lors de la supression de la sortie :', error);
          if (spinner) {
            spinner.classList.add('d-none');
          }
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) {
        spinner.classList.add('d-none');
      }
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadVehicules(): void {
    this.sortieService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data;
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
        }));
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }

  loadCommunes(): void {
    this.sortieService.getAllCommunes().subscribe({
      next: (data) => {
        this.communes = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
      }
    });
  }

  loadTypeMouvements(): void {
    this.sortieService.getAllTypeMouvement().subscribe({
      next: (data) => {
        this.type_mouvements = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des couponTickets :", err);
      }
    });
  }

  loadCompagniePetrolieres(): void {
    this.sortieService.getAllCompagniePetrolieres().subscribe({
      next: (data) => {
        this.compagniePetrolieres = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des compagnies Petrolieres :", err);
      }
    });
  }

  onClickSubmitKilometrageFin(modal: any) {
  if (this.addKilometrageFin.invalid) {
    alert("Veuillez entrer un kilométrage valide.");
    return;
  }

  const kilometrage = this.addKilometrageFin.value.kilometrage_de_fin;
  const mouvementId = this.addKilometrageFin.value.id;
  console.log(this.addKilometrageFin?.value);

  this.sortieService.updateKilometrageDeFin(mouvementId, { kilometrage_de_fin: kilometrage }).subscribe(
    (res: any) => {
      modal.close();
      console.log("Kilométrage de fin mis à jour avec succès :", res);
      alert("Mise à jour réussie !");
    },
    (err: any) => {
      console.error("Erreur lors de la mise à jour du kilométrage :", err);
      alert("Erreur lors de la mise à jour du kilométrage.");
    }
  );
}

  loadCouponTicketsWithCompagnies(): void {
    this.sortieService.getCouponTicketsWithCompagnies().subscribe({
      next: (res) => {
        if (res.success) {
          this.couponTicketsWithCompagnies = res.data
            .filter((item: any) => {
              const isValid = item.coupon_ticket && item.compagnie;
              return isValid;
            })
            .map((item: any) => {
              const coupon = item.coupon_ticket;
              const compagnie = item.compagnie;
              return {
                id: `${coupon?.id}-${compagnie?.id}`,
                displayLabel: `${coupon?.libelle ?? ''} (${compagnie?.libelle ?? ''})`,
                coupon_ticket_actual_id: coupon?.id ?? null,
                compagnie_petrolier_actual_id: compagnie?.id ?? null
              };
            });
        } else {
          console.error("La réponse du service getCouponTicketsWithCompagnies n'indique pas le succès:", res);
        }
      },
      error: (err) => {
        console.error("Erreur lors du chargement des coupons :", err);
      }
    });
  }


  loadSorties(): void {
    // Le type de retour du service doit correspondre
    this.sortieService.getAllMouvementTicketSortie().subscribe(
      (data: TransactionSortie[]) => {
        console.log("Réponse API sortie:", data);
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des sorties de tickets', error);
        this.loadingIndicator = false;
      }
    );
  }

  loadCategoriesSortie(): void {
    this.categorieSortieTicketService.getAllCategorieSortieTickets().subscribe({
      next: (categories: CategorieSortieTicket[]) => {
        // Le service retourne directement le tableau, donc on l'assigne directement.
        this.categoriesSortie = categories;
        console.log('Catégories de sortie chargées avec succès:', this.categoriesSortie);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories de sortie:', error);
        // Ajoutez ici une gestion d'erreur plus conviviale.
        //this.toastr.error('Impossible de charger les catégories de sortie.');
      }
    });
  }

  // La fonction pour le modal
  getViewForm(row: TransactionSortie) {
    this.selectedSortie = row;
  }

  // MISE À JOUR CRUCIALE DE LA FONCTION DE FILTRAGE
  updateFilter(event: Event): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    // Le filtrage doit maintenant chercher dans le tableau 'tickets'
    this.rows = this.temp.filter(sortie => {
      // Vérifie si au moins un ticket dans la transaction correspond à la recherche
      const ticketMatch = sortie.tickets.some(ticket =>
        (ticket.coupon?.libelle && ticket.coupon.libelle.toLowerCase().includes(val)) ||
        (ticket.compagnie?.libelle && ticket.compagnie.libelle.toLowerCase().includes(val))
      );

      // Retourne vrai si un ticket correspond OU si une autre propriété commune correspond
      return (
        (sortie.reference && sortie.reference.toLowerCase().includes(val)) ||
        (sortie.vehicule?.immatriculation && sortie.vehicule.immatriculation.toLowerCase().includes(val)) ||
        (sortie.employe?.fullnameEmploye && sortie.employe.fullnameEmploye.toLowerCase().includes(val)) ||
        (sortie.objet && sortie.objet.toLowerCase().includes(val)) ||
        ticketMatch // Ajout de la condition de recherche sur les tickets
      );
    });

    this.table.offset = 0;
  }


  // loadSorties(): void {
  //   this.sortieService.getAllMouvementTicketSortie().subscribe(
  //     (data: MouvementTicket[]) => {
  //       this.temp = [...data];
  //       this.rows = data;
  //       this.loadingIndicator = false;
  //     },
  //     error => {
  //       console.error('Erreur lors du chargement des Mouvements Ticket Sortie', error);
  //       this.loadingIndicator = false;
  //     }
  //   );
  // }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(sortie =>
  //     (sortie.reference && sortie.reference.toLowerCase().includes(val)) ||
  //     (sortie.vehicule && sortie.vehicule.immatriculation && sortie.vehicule.immatriculation.toLowerCase().includes(val)) ||
  //     (sortie.coupon_ticket && sortie.coupon_ticket.libelle && sortie.coupon_ticket.libelle.toLowerCase().includes(val)) ||
  //     (sortie.compagnie_petrolier && sortie.compagnie_petrolier.libelle && sortie.compagnie_petrolier.libelle.toLowerCase().includes(val)) ||
  //     (sortie.depart && sortie.depart.libelle_commune && sortie.depart.libelle_commune.toLowerCase().includes(val)) ||
  //     (sortie.arriver && sortie.arriver.libelle_commune && sortie.arriver.libelle_commune.toLowerCase().includes(val)) ||
  //     (sortie.kilometrage && String(sortie.kilometrage).toLowerCase().includes(val)) ||
  //     (sortie.employe && sortie.employe.nom && sortie.employe.nom.toLowerCase().includes(val)) ||
  //     (sortie.objet && sortie.objet.toLowerCase().includes(val)) ||
  //     (sortie.description && sortie.description.toLowerCase().includes(val)) ||
  //     (sortie.qte && String(sortie.qte).toLowerCase().includes(val))
  //   );

  //   this.table.offset = 0;
  // }


  getEditForm(row: TransactionSortie) {
    console.log('Objet à éditer:', row); // 👈 AJOUTEZ CECI POUR VÉRIFIER
    // 1️⃣ Extraire le premier ticket (ou gérer si tu en as plusieurs)
    const firstTicket = row.tickets && row.tickets.length > 0 ? row.tickets[0] : null;

    // 2️⃣ Construire l’ID composite si ticket trouvé
    const selectedCompositeId = firstTicket
      ? this.couponTicketsWithCompagnies.find(
          item =>
            item.coupon_ticket_actual_id === firstTicket.coupon?.id &&
            item.compagnie_petrolier_actual_id === firstTicket.compagnie?.id
        )?.id || null
      : null;

      // 💡 Débogage : vérifiez l'ID de l'élément que vous recevez
      console.log("🐛 ID de l'élément reçu :", row.id);

    // 3️⃣ Patch le formulaire avec les bons champs
    this.editSortie.patchValue({
      id: row.id || null,
      vehicule_id: row.vehicule?.id || null,
      // Utiliser l'ID composite pour le formulaire pour qu'il corresponde à la liste déroulante
      coupon_ticket_id: selectedCompositeId,
      // Ces deux champs ne sont plus nécessaires dans la logique front-end du formulaire
      compagnie_petrolier_id: null,
      kilometrage: row.kilometrage,
      kilometrage_de_fin: row.kilometrage_de_fin,
      employe_id: row.employe?.id || null,
      commune_depart: row.commune_depart?.id || null,
      commune_arriver: row.commune_arriver?.id || null,
      objet: row.objet,
      description: row.description,
      date: this.convertToNgbDate(row.date),
      trajet_aller_retour: row.trajet_aller_retour,
      id_categorie_sortie_ticket: row.categorie_sortie_ticket?.id || null,
      qte: firstTicket?.qte || null
    });

    console.log("✏️ Formulaire de modification rempli :", this.editSortie.value);
}


  getDeleteForm(row: any) {
    this.deleteSortie.patchValue({
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

  formatEmploye(employe: any): string {
    return employe ? `${employe.nom} ${employe.prenom}` : '';
  }

  // updateQuantiteDisponible() {
  //   const compositeId = this.addSortie.get('coupon_ticket_id')?.value;
  //   let idCoupon: number | null = null;
  //   let idCompagnie: number | null = null;

  //   if (compositeId) {
  //     const selectedItem = this.couponTicketsWithCompagnies.find(item => item.id === compositeId);
  //     if (selectedItem) {
  //       idCoupon = selectedItem.coupon_ticket_actual_id;
  //       idCompagnie = selectedItem.compagnie_petrolier_actual_id;
  //     }
  //   }

  //   if (idCoupon === null || idCompagnie === null) {
  //     this.quantiteDisponible = 0;
  //     console.log('DEBUG: Coupon ou compagnie non sélectionnés, quantiteDisponible = 0.');
  //     this.addSortie.get('qte')?.disable();
  //     this.trajetNotFoundMessage = null;
  //   }

  //   this.sortieService.getQuantiteDisponible(idCoupon, idCompagnie).subscribe(
  //     (response) => {
  //       this.quantiteDisponible = response.data;
  //       console.log('DEBUG: Réponse de getQuantiteDisponible:', response.data);
  //       console.log('DEBUG: quantiteDisponible mise à jour à:', this.quantiteDisponible);

  //       const qteControl = this.addSortie.get('qte');
  //       qteControl?.setValidators([
  //         Validators.required,
  //         Validators.min(1),
  //         Validators.max(this.quantiteDisponible)
  //       ]);
  //       qteControl?.updateValueAndValidity();
  //       qteControl?.enable();
  //       this.trajetNotFoundMessage = null;

  //     },
  //     (error) => {
  //       console.error('Erreur lors de la récupération de la quantité disponible:', error);
  //       this.quantiteDisponible = 0;
  //       this.addSortie.get('qte')?.disable();
  //       this.trajetNotFoundMessage = null;
  //     }
  //   );
  // }

  // onCouponSelected(event: any): void {
  //   if (event) {
  //     this.coupon_ticket_id = event.coupon_ticket_actual_id;
  //     this.compagnie_petrolier_id = event.compagnie_petrolier_actual_id;

  //     this.addSortie.patchValue({
  //       coupon_ticket_id: event.id,
  //       compagnie_petrolier_id: this.compagnie_petrolier_id
  //     });
  //     this.updateQuantiteDisponible();

  //   } else {
  //     this.addSortie.patchValue({
  //       coupon_ticket_id: null,
  //       compagnie_petrolier_id: null
  //     });
  //     this.quantiteDisponible = 0;
  //     this.addSortie.get('qte')?.disable();
  //     this.trajetNotFoundMessage = null;
  //   }
  // }

  // Déclarez cette propriété dans votre classe pour stocker les quantités
quantitesDisponibles: { [key: number]: number } = {};

updateQuantiteDisponible(index: number, couponId: number, compagnieId: number): void {
  const ticketFormGroup = this.tickets.at(index) as FormGroup;
  const qteControl = ticketFormGroup.get('qte');

  if (couponId === null || compagnieId === null) {
    this.quantitesDisponibles[index] = 0;
    qteControl?.disable();
    qteControl?.setErrors(null);
    return;
  }

  this.sortieService.getQuantiteDisponible(couponId, compagnieId).subscribe(
    (response: any) => {
      const quantite = response.data;
      this.quantitesDisponibles[index] = quantite;

      qteControl?.enable();
      // Met à jour les validateurs avec la nouvelle quantité maximale
      qteControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(quantite),
      ]);
      qteControl?.updateValueAndValidity();
    },
    (error: any) => {
      console.error('Erreur lors de la récupération de la quantité disponible:', error);
      this.quantitesDisponibles[index] = 0;
      qteControl?.disable();
      qteControl?.setErrors(null);
    }
  );
}

    onCouponSelected(event: any, index: number): void {
    const ticketFormGroup = this.tickets.at(index) as FormGroup;

    if (event) {
      const couponId = event.coupon_ticket_actual_id;
      const compagnieId = event.compagnie_petrolier_actual_id;

      // Met à jour la valeur du coupon_ticket_id dans le formulaire
      ticketFormGroup.patchValue({
        coupon_ticket_id: event.id,
      });

      // Appelle la fonction de mise à jour de la quantité disponible
      this.updateQuantiteDisponible(index, couponId, compagnieId);
    } else {
      // Si le coupon est désélectionné, réinitialise le formulaire du ticket
      ticketFormGroup.patchValue({
        coupon_ticket_id: null,
        qte: null,
      });
      // Désactive le champ de quantité et efface les erreurs
      const qteControl = ticketFormGroup.get('qte');
      if (qteControl) {
        qteControl.disable();
        qteControl.setErrors(null);
      }
      // Supprime la quantité disponible de l'affichage
      delete this.quantitesDisponibles[index];
    }
  }

  genererBonDeSortie(reference: string): void {
    // Ajoutez la logique ici pour appeler votre API Laravel
    // par exemple :
    this.sortieService.genererBonDeSortie(reference).subscribe({
      next: (response) => {
        // Logic pour gérer le PDF
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bon_de_sortie_${reference}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors de la génération du bon de sortie', error);
        alert('Une erreur est survenue lors de la génération du bon.');
      }
    });
  }

  // Méthode appelée lorsque l'utilisateur sélectionne un fichier
  // Fichier : sortie.component.ts
  onFileSelected(event: any, mouvementId: number): void {
    const file: File = event.target.files[0];
    if (file) {
      this.sortieService.televerserBon(mouvementId, file).subscribe({
        next: (response) => {
          console.log('Fichier téléversé avec succès', response);

          // 1. Trouver l'objet `TransactionSortie` qui correspond à l'ID
          const updatedSortie = this.rows.find((s: TransactionSortie) => s.id === mouvementId);

          if (updatedSortie) {
            // 2. Mettre à jour la propriété `bon_de_sortie_path` avec la valeur renvoyée par l'API
            updatedSortie.bon_de_sortie_path = response.bon_de_sortie_path;
          }

          // 3. Mettre à jour l'objet sélectionné si c'est celui qui est affiché dans le modal
          if (this.selectedSortie && this.selectedSortie.id === mouvementId) {
            this.selectedSortie.bon_de_sortie_path = response.bon_de_sortie_path;
          }

          // Si vous utilisez `loadSorties`, vous pouvez aussi l'appeler pour rafraîchir la liste
          // this.loadSorties();
        },
        error: (error) => {
          console.error('Erreur lors du téléversement', error);
        }
      });
    }
  }

  // Méthode pour voir le bon
  voirBonDeSortie(mouvementId: number): void {
    this.sortieService.voirBon(mouvementId).subscribe({
      next: (response) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      error: (error) => {
        console.error('Erreur lors de la visualisation', error);
      }
    });
  }


  calculerQuantiteTicket() {
    const data = {
      commune_depart: this.addSortie.get('commune_depart')?.value,
      commune_arriver: this.addSortie.get('commune_arriver')?.value,
      trajet_aller_retour: this.addSortie.get('trajet_aller_retour')?.value,
      coupon_ticket_id: null as number | null,
    };

    const qteControl = this.addSortie.get('qte');
    this.trajetNotFoundMessage = null; // Effacer tout message précédent avant un nouveau calcul

    const compositeCouponId = this.addSortie.get('coupon_ticket_id')?.value;
    if (compositeCouponId) {
      const selectedItem = this.couponTicketsWithCompagnies.find(item => item.id === compositeCouponId);
      if (selectedItem) {
        data.coupon_ticket_id = selectedItem.coupon_ticket_actual_id;
      }
    }

    if (!data.commune_depart || !data.commune_arriver || data.coupon_ticket_id === null) {
      alert("Veuillez sélectionner le coupon, la commune de départ et la commune d'arrivée.");
      qteControl?.enable(); // S'assurer que le champ qte est activé pour la saisie manuelle
      return;
    }

    this.sortieService.getQuantiteTicketAttribution(data).subscribe({
      next: (res) => {
        const qteCalculee = res.qteTicket;

        console.log('DEBUG: calculerQuantiteTicket - qteCalculee (du trajet):', qteCalculee);
        console.log('DEBUG: calculerQuantiteTicket - quantiteDisponible (du coupon, avant comparaison):', this.quantiteDisponible);

        if (qteCalculee === 0 || qteCalculee === null || qteCalculee === undefined) {
          // Trajet non trouvé ou calculé à 0. L'utilisateur entrera la qte manuellement.
          this.addSortie.patchValue({ qte: null }); // Vider le champ pour la saisie manuelle
          qteControl?.enable(); // Activer le champ pour la saisie manuelle
          this.trajetNotFoundMessage = "Le trajet n'existe pas. Entrer la quantité.";
        } else if (qteCalculee <= this.quantiteDisponible) {
          // Trajet trouvé et quantité disponible suffisante
          this.addSortie.patchValue({ qte: qteCalculee });
          qteControl?.disable(); // Désactiver le champ car la quantité est calculée
          this.trajetNotFoundMessage = null; // Effacer le message
        } else {
          // Trajet trouvé mais quantité disponible insuffisante
          this.addSortie.patchValue({ qte: this.quantiteDisponible }); // Proposer la quantité max disponible
          qteControl?.enable(); // Activer le champ pour permettre à l'utilisateur d'ajuster ou de confirmer
          this.trajetNotFoundMessage = `La quantité calculée (${qteCalculee}) dépasse la quantité disponible (${this.quantiteDisponible}). Veuillez ajuster la quantité.`;
        }

        // Mettre à jour les validateurs de qte en fonction de la quantiteDisponible
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();
      },
      error: (error) => {
        console.error('Erreur est survenue lors du calcul de la quantité de ticket:', error);
        alert('Une erreur est survenue lors du calcul de la quantité de ticket. Veuillez réessayer. Détails: ' + (error.error?.message || error.message));
        this.addSortie.patchValue({ qte: null }); // Vider le champ en cas d'erreur
        qteControl?.enable(); // Activer le champ en cas d'erreur
        qteControl?.setValidators([Validators.required, Validators.min(1), Validators.max(this.quantiteDisponible)]);
        qteControl?.updateValueAndValidity();
        this.trajetNotFoundMessage = null; // Effacer le message en cas d'erreur
      },
    });
  }
}
