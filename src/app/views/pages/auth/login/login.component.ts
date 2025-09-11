import { NgStyle } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core'; // Ajout de OnDestroy
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup,FormBuilder, ReactiveFormsModule,Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SiteSettingsService } from '../../../../core/services/site-settings/site-settings.service'; // NOUVEL IMPORT
import { Subject, takeUntil } from 'rxjs'; // NOUVEAUX IMPORTS POUR GÉRER LES OBSERVABLES
import { Exercice, ExerciceResponse } from '../../../../core/services/interface/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
NgStyle,
    RouterLink,
    ReactiveFormsModule,
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy { // Implémente OnDestroy
  returnUrl: string = '/';
  public loginForm!: FormGroup ;
  exerciceEnCours!: Exercice | null;

  // PROPRIÉTÉ POUR LE NOM DU SITE (AJOUTÉE)
  siteName: string = 'Chargement...';

  // SUBJECT POUR GÉRER LA DÉSINSCRIPTION (AJOUTÉ)
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private siteSettingsService: SiteSettingsService, // INJECTION DU SERVICE
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.loginForm = this.formBuilder.group({
      email: ["" ,[Validators.required]],
      password: ["" ,[Validators.required]],

    });

    this.loadexerciceEnCours();

    // S'abonner aux changements du nom du site (AJOUTÉ)
    this.siteSettingsService.siteSettings$.pipe(
      takeUntil(this.destroy$) // Gérer la désinscription
    ).subscribe(settings => {
      this.siteName = settings.companyName;
      console.log('LoginComponent: Nom du site mis à jour:', this.siteName);
    });

    // Optionnel: Charger les paramètres du site au démarrage de la page de connexion
    // Utile si l'utilisateur arrive directement sur la page de connexion sans passer par AppComponent
    this.siteSettingsService.getSettings().subscribe({
        next: () => console.log('LoginComponent: Paramètres du site chargés.'),
        error: (err) => console.error('LoginComponent: Erreur au chargement des paramètres:', err)
    });
  }



  // MÉTHODE ngOnDestroy POUR LA DÉSINSCRIPTION (AJOUTÉE)
  ngOnDestroy(): void {
    this.destroy$.next(); // Émet une valeur pour désinscrire tous les abonnements RxJS
    this.destroy$.complete(); // Complète le Subject
  }

  onLoggedin(e: Event) {
    e.preventDefault();
    console.log("Connexion...")
    const spinner = document.querySelector('.spinner-border');
    if (this.loginForm.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('permissions', JSON.stringify(response.data.perm));
        localStorage.setItem('isLoggedin', 'true');
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Identifiants incorrects ou compte inactif');
      }
    });
    }else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
  }

loadexerciceEnCours(): void {
  this.authService.getExercice().subscribe(
    (response: ExerciceResponse) => {
      if (response.success && response.exercice.statut === 'ouvert') {
        this.exerciceEnCours = response.exercice;
      } else {
        this.exerciceEnCours = null;
      }
    },
    (error: any) => {
      console.error('Erreur lors du chargement de l\'exercice ouvert', error);
      this.exerciceEnCours = null;
    }
  );
}




}
