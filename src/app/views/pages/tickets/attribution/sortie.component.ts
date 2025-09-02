import { Component, ViewChild, OnInit, inject,TemplateRef, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementTicketService } from '../../../../core/services/mouvement-ticket/sortie.service';
import { Employe, TypeMouvement, CompagniePetroliere, Vehicule, CouponTicket, MouvementTicket, Commune } from '../../../../core/services/interface/models';
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
  rows: MouvementTicket[] = [];
  temp: MouvementTicket[] = [];
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
  selectedSortie: any = null;

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

  isAddingSortie: boolean = false;

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('addKilometrageFinContent') addKilometrageFinContent!: TemplateRef<any>;

  constructor(
    private sortieService: MouvementTicketService,
    private formBuilder: FormBuilder,
    private router: Router,
    private ngbModalService: NgbModal,
    public modalService: NgbModal,
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
    }

    this.addSortie = this.formBuilder.group({
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [ Validators.min(0)]],
      employe_id: [null, [Validators.required]],
      commune_depart: [null, []],
      commune_arriver: [null, []],
      description: ["", []],
      objet: ["", []],
      qte: [null, [Validators.required, Validators.min(1)]], // Initialisé à null pour permettre la saisie
      date: [this.currentDate, [Validators.required]],
      trajet_aller_retour: [false, []],
    });

    this.editSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [Validators.required, Validators.min(0)]],
      employe_id: [null, []],
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required, Validators.min(1)]],
      date: ["", [Validators.required]],
      trajet_aller_retour: [false, []],
    });

    this.deleteSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    this.addKilometrageFin = this.formBuilder.group({
      id: [0, [Validators.required]],
      kilometrage_de_fin: [null, [ Validators.min(0)]],
    });


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

  getViewForm(row: any) {
    if (!row || !row.id) {
      console.error('Données de sortie invalides:', row);
      return;
    }

    this.selectedSortie = row;
  }

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
    console.log('DEBUG: Tentative de soumission du formulaire.');
    console.log('DEBUG: addSortie.valid:', this.addSortie.valid);
    console.log('DEBUG: addSortie.errors:', this.addSortie.errors);
    Object.keys(this.addSortie.controls).forEach(key => {
      const control = this.addSortie.get(key);
      if (control?.invalid) {
        console.log(`DEBUG: Contrôle '${key}' est invalide. Erreurs:`, control.errors);
      }
    });


    if (this.isAddingSortie) {
      return;
    }

    const spinner = document.querySelector('.spinner-add-sortie');

    if (this.addSortie.valid) {
      this.isAddingSortie = true;
      if (spinner) {
        spinner.classList.remove('d-none');
      }

      const formData = {
        ...this.addSortie.value,
        date: this.formatDate(this.addSortie.value.date),
      };

      const selectedItem = this.couponTicketsWithCompagnies.find(
        item => item.id === formData.coupon_ticket_id
      );

      if (selectedItem) {
        formData.coupon_ticket_id = selectedItem.coupon_ticket_actual_id;
        formData.compagnie_petrolier_id = selectedItem.compagnie_petrolier_actual_id;
      } else {
        console.error("Erreur: L'élément sélectionné n'a pas été trouvé dans la liste des coupons mappés.");
        alert("Erreur lors de la soumission: Coupon sélectionné invalide.");
        if (spinner) {
          spinner.classList.add('d-none');
        }
        this.isAddingSortie = false;
        return;
      }

      this.sortieService.saveMouvementTicketSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) {
            spinner.classList.add('d-none');
          }
          this.addSortie.reset();
          this.isAddingSortie = false;
          this.addSortie.get('qte')?.enable(); // Réactiver le champ qte après reset
          this.trajetNotFoundMessage = null; // Effacer le message après succès

          const modal = document.getElementById('add_sortie');
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
          console.error('Erreur lors de l\'ajout de la sortie :', error);
          if (spinner) {
            spinner.classList.add('d-none');
          }
          this.isAddingSortie = false;
          alert('Une erreur s\'est produite. Veuillez réessayer. Détails: ' + (error.error?.message || error.message));
        }
      );
    } else {
      if (spinner) {
        spinner.classList.add('d-none');
      }
      this.markFormGroupTouched(this.addSortie);
      alert("Désolé, le formulaire n'est pas bien renseigné");
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

    if (this.editSortie.valid) {
      if (spinner) {
        spinner.classList.remove('d-none');
      }

      const compositeCouponId = this.editSortie.get('coupon_ticket_id')?.value;
      let actualCouponId: number | null = null;
      let actualCompagnieId: number | null = null;

      if (compositeCouponId) {
        const selectedItem = this.couponTicketsWithCompagnies.find(item => item.id === compositeCouponId);
        if (selectedItem) {
          actualCouponId = selectedItem.coupon_ticket_actual_id;
          actualCompagnieId = selectedItem.compagnie_petrolier_actual_id;
        } else {
          console.error("Erreur: L'élément sélectionné pour l'édition n'a pas été trouvé dans la liste des coupons.");
          alert("Erreur lors de la soumission: Coupon sélectionné invalide pour l'édition.");
          if (spinner) {
            spinner.classList.add('d-none');
          }
          return;
        }
      }

      const formData = {
        ...this.editSortie.value,
        coupon_ticket_id: actualCouponId,
        compagnie_petrolier_id: actualCompagnieId,
        date: this.formatDate(this.editSortie.value.date),
      };

      this.sortieService.editMouvementTicketSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) {
            spinner.classList.add('d-none');
          }
          this.editSortie.reset();

          const modal = document.getElementById('edit_sortie');
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
          console.error('Erreur lors de la modification de la sortie :', error);
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
    this.sortieService.getAllMouvementTicketSortie().subscribe(
      (data: MouvementTicket[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Ticket Sortie', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(sortie =>
      (sortie.reference && sortie.reference.toLowerCase().includes(val)) ||
      (sortie.vehicule && sortie.vehicule.immatriculation && sortie.vehicule.immatriculation.toLowerCase().includes(val)) ||
      (sortie.coupon_ticket && sortie.coupon_ticket.libelle && sortie.coupon_ticket.libelle.toLowerCase().includes(val)) ||
      (sortie.compagnie_petrolier && sortie.compagnie_petrolier.libelle && sortie.compagnie_petrolier.libelle.toLowerCase().includes(val)) ||
      (sortie.depart && sortie.depart.libelle_commune && sortie.depart.libelle_commune.toLowerCase().includes(val)) ||
      (sortie.arriver && sortie.arriver.libelle_commune && sortie.arriver.libelle_commune.toLowerCase().includes(val)) ||
      (sortie.kilometrage && String(sortie.kilometrage).toLowerCase().includes(val)) ||
      (sortie.employe && sortie.employe.nom && sortie.employe.nom.toLowerCase().includes(val)) ||
      (sortie.objet && sortie.objet.toLowerCase().includes(val)) ||
      (sortie.description && sortie.description.toLowerCase().includes(val)) ||
      (sortie.qte && String(sortie.qte).toLowerCase().includes(val))
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    const selectedCompositeId = this.couponTicketsWithCompagnies.find(
      item => item.coupon_ticket_actual_id === row.coupon_ticket_id && item.compagnie_petrolier_actual_id === row.compagnie_petrolier_id
    )?.id || null;

    this.editSortie.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      coupon_ticket_id: selectedCompositeId,
      kilometrage: row.kilometrage,
      employe_id: row.employe_id,
      commune_depart: row.commune_depart,
      commune_arriver: row.commune_arriver,
      description: row.description,
      qte: row.qte,
      objet: row.objet,
      date: this.convertToNgbDate(row.date),
      trajet_aller_retour: row.trajet_aller_retour
    });
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

  updateQuantiteDisponible() {
    const compositeId = this.addSortie.get('coupon_ticket_id')?.value;
    let idCoupon: number | null = null;
    let idCompagnie: number | null = null;

    if (compositeId) {
      const selectedItem = this.couponTicketsWithCompagnies.find(item => item.id === compositeId);
      if (selectedItem) {
        idCoupon = selectedItem.coupon_ticket_actual_id;
        idCompagnie = selectedItem.compagnie_petrolier_actual_id;
      }
    }

    if (idCoupon === null || idCompagnie === null) {
      this.quantiteDisponible = 0;
      console.log('DEBUG: Coupon ou compagnie non sélectionnés, quantiteDisponible = 0.');
      this.addSortie.get('qte')?.disable();
      this.trajetNotFoundMessage = null; // Effacer le message si le coupon change
      return;
    }

    this.sortieService.getQuantiteDisponible(idCoupon, idCompagnie).subscribe(
      (response) => {
        this.quantiteDisponible = response.data;
        console.log('DEBUG: Réponse de getQuantiteDisponible:', response.data);
        console.log('DEBUG: quantiteDisponible mise à jour à:', this.quantiteDisponible);

        const qteControl = this.addSortie.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();
        qteControl?.enable(); // S'assurer que le champ qte est activé après la mise à jour de la quantité disponible
        this.trajetNotFoundMessage = null; // Effacer le message si la quantité disponible est mise à jour

      },
      (error) => {
        console.error('Erreur lors de la récupération de la quantité disponible:', error);
        this.quantiteDisponible = 0;
        this.addSortie.get('qte')?.disable(); // Désactiver le champ qte en cas d'erreur
        this.trajetNotFoundMessage = null; // Effacer le message en cas d'erreur de récupération de stock
      }
    );
  }

  onCouponSelected(event: any): void {
    if (event) {
      this.coupon_ticket_id = event.coupon_ticket_actual_id;
      this.compagnie_petrolier_id = event.compagnie_petrolier_actual_id;

      this.addSortie.patchValue({
        coupon_ticket_id: event.id,
        compagnie_petrolier_id: this.compagnie_petrolier_id
      });
      this.updateQuantiteDisponible();

    } else {
      this.addSortie.patchValue({
        coupon_ticket_id: null,
        compagnie_petrolier_id: null
      });
      this.quantiteDisponible = 0;
      this.addSortie.get('qte')?.disable(); // Désactiver le champ qte si aucun coupon n'est sélectionné
      this.trajetNotFoundMessage = null; // Effacer le message si le coupon est désélectionné
    }
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
