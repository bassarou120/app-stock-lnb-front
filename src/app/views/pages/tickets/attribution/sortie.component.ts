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



  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addSortie!: FormGroup;
  public editSortie!: FormGroup;
  public deleteSortie!: FormGroup;

  communes: Commune[] = []; // Liste des communes
  // Fichiers sélectionnés

  @ViewChild('table') table!: DatatableComponent;

  constructor(private sortieService: MouvementTicketService, private formBuilder: FormBuilder,) { }


  ngOnInit(): void {
    this.loadCommunes();
    this.loadTypeMouvements();
    this.loadCompagniePetrolieres()
    this.loadCouponTicketsWithCompagnies();
    this.loadEmployes();
    this.loadVehicules();
    this.loadSorties();
    this.addSortie = this.formBuilder.group({
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [Validators.required]],
      employe_id: [null, [Validators.required]],
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
      trajet_aller_retour: [false, []],
    });
    this.editSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
      // id_type_mouvements: [null, [Validators.required]],
      compagnie_petrolier_id: [null, [Validators.required]],
      vehicule_id: [null, [Validators.required]],
      coupon_ticket_id: [null, [Validators.required]],
      kilometrage: [null, [Validators.required]],
      employe_id: [null, []],
      commune_depart: [null, [Validators.required]],
      commune_arriver: [null, [Validators.required]],
      description: ["", []],
      objet: ["", []],
      qte: [1, [Validators.required]],
      date: ["", [Validators.required]],
      trajet_aller_retour: [false, []],
    });
    this.deleteSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  onClickSubmitAddSortie() {
    console.log(this.addSortie.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addSortie.value,
        date: this.formatDate(this.addSortie.value.date), // Convertir la date
      };
      this.sortieService.saveMouvementTicketSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.addSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_sortie');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      console.log("Erreurs du formulaire :", this.addSortie.errors);
      console.log("Statut des champs :", this.addSortie.controls);
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditSortie() {
    console.log(this.editSortie.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editSortie.value.id;
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
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteSortie() {
    console.log(this.deleteSortie.value);
    const spinner = document.querySelector('.spinnerDelete');

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
        console.log('Communes chargées :', this.communes);
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

  // loadCouponTickets(): void {
  //   this.sortieService.getAllCouponTickets().subscribe({
  //     next: (data) => {
  //       this.couponTickets = data; // Stocker la liste des couponTickets
  //     },
  //     error: (err) => {
  //       console.error("Erreur lors du chargement des couponTickets :", err);
  //     }
  //   });
  // }

  loadCouponTicketsWithCompagnies(): void {
    this.sortieService.getCouponTicketsWithCompagnies().subscribe({
      next: (res) => {
        if (res.success) {
          this.couponTicketsWithCompagnies = res.data.map((item: any) => {
            return {
              id: item.coupon_ticket.id,
              displayLabel: `${item.coupon_ticket.libelle} (${item.compagnie.libelle})`,
              coupon_ticket_id: item.coupon_ticket.id,
              compagnie_petrolier_id: item.compagnie.id
            };
          });
          console.log("Bonjour", this.couponTicketsWithCompagnies);
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
        console.error('Erreur lors du chargement des Mouvements Ticket Entree', error);
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
      employe_id: row.employe?.id,
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
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer YYYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  formatEmploye(employe: any): string {
    return employe ? `${employe.nom} ${employe.prenom}` : '';
  }

  //   updateQuantiteDisponibleCoupon() {
  //     const idCoupon = this.addSortie.get('coupon_ticket_id')?.value;
  //     console.log('ID du coupon sélectionné:', idCoupon);

  //     if (!idCoupon) {
  //       console.log('Aucun coupon sélectionné ou désélection effectuée');
  //       this.quantiteDisponibleCoupon = 0;
  //       return;
  //     }

  //     this.sortieService.getQuantiteDisponibleCoupon(idCoupon).subscribe(
  //       (response) => {
  //         console.log('Quantité disponible:', response.data);
  //         this.quantiteDisponibleCoupon = response.data;

  //         // 🔥 On met à jour le validateur max du champ qte
  //         this.addSortie.get('qte')?.setValidators([
  //           Validators.required,
  //           Validators.min(1),
  //           Validators.max(this.quantiteDisponibleCoupon)
  //         ]);
  //         this.addSortie.get('qte')?.updateValueAndValidity();

  //       },
  //       (error) => {
  //         console.error('Erreur lors de la récupération de la quantité disponible:', error);
  //         this.quantiteDisponibleCoupon = 0;
  //       }
  //     );

  // }
  updateQuantiteDisponible() {
    const idCoupon = this.addSortie.get('coupon_ticket_id')?.value;
    const idCompagnie = this.addSortie.get('compagnie_petrolier_id')?.value;
    console.log('ID du coupon sélectionné:', idCoupon);

    if (!idCoupon) {
      console.log('Aucun article sélectionné ou désélection effectuée');
      this.quantiteDisponible = 0;
      return;
    }

    this.sortieService.getQuantiteDisponible(idCoupon, idCompagnie).subscribe(
      (response) => {
        console.log('Quantité disponible:', response.data);
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

      console.log('Coupon ID:', this.coupon_ticket_id);
      console.log('Compagnie ID:', this.compagnie_petrolier_id);

      this.addSortie.patchValue({
        coupon_ticket_id: this.coupon_ticket_id,
        compagnie_petrolier_id: this.compagnie_petrolier_id
      });
      this.updateQuantiteDisponible();

    }
  }

  calculerQuantiteTicket() {
    const data = {
      commune_depart: this.addSortie.get('commune_depart')?.value,
      commune_arriver: this.addSortie.get('commune_arriver')?.value,
      trajet_aller_retour: this.addSortie.get('trajet_aller_retour')?.value,
      coupon_ticket_id: this.addSortie.get('coupon_ticket_id')?.value,
    };

    // Appelle le service
    this.sortieService.getQuantiteTicketAttribution(data).subscribe({
      next: (res) => {
        this.addSortie.patchValue({ qte: res.qteTicket });
      },
      error: (err) => {
        console.error('Erreur de calcul de ticket', err);
        // Tu peux aussi afficher un message d'erreur à l'utilisateur ici
      },
    });
  }






}





