import { NgStyle } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ReactiveFormsModule,
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './profil-user.component.html',
  styleUrl: './profil-user.component.scss'
})
export class ProfileUserComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any = null;
  loading = false;
  successMessage = '';
  errorMessage = '';
  showPasswordSection = false;

  // Variables pour la visibilité des mots de passe
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;


  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  /**
   * Initialiser les formulaires
   */
  initForms(): void {
    // Formulaire pour les informations de base
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      surname: ['', [Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.maxLength(20)]]
    });

    // Formulaire pour le changement de mot de passe
    this.passwordForm = this.formBuilder.group({
      current_password: ['', [Validators.required, Validators.minLength(6)]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password_confirmation: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validateur personnalisé pour vérifier la correspondance des mots de passe
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('new_password')?.value;
    const confirmation = group.get('new_password_confirmation')?.value;

    if (newPassword !== confirmation) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Charger le profil de l'utilisateur
   */
  loadProfile(): void {
    this.loading = true;

    // D'abord essayer de récupérer depuis localStorage
    const cachedUser = this.authService.getCurrentUser();
    if (cachedUser) {
      this.user = cachedUser;
      this.populateForm();
    }

    // Ensuite faire un appel API pour avoir les données à jour
    this.authService.getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.user = response.data;
            this.populateForm();
            // Mettre à jour le localStorage avec les données fraîches
            localStorage.setItem('user', JSON.stringify(this.user));
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil:', error);
          this.errorMessage = 'Impossible de charger le profil.';
          this.loading = false;
        }
      });
  }

  /**
   * Remplir le formulaire avec les données de l'utilisateur
   */
  populateForm(): void {
    if (this.user) {
      this.profileForm.patchValue({
        name: this.user.name || '',
        surname: this.user.surname || '',
        email: this.user.email || '',
        phone: this.user.phone || ''
      });
    }
  }

  /**
   * Mettre à jour les informations du profil
   */
  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.loading = true;
    this.clearMessages();

    const formData = this.profileForm.value;

    this.authService.updateProfile(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = response.message || 'Profil mis à jour avec succès.';
            this.user = response.data || this.user;

            // Mettre à jour le localStorage
            if (this.user) {
              localStorage.setItem('user', JSON.stringify(this.user));
            }
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          if (error.error?.errors) {
            this.errorMessage = this.formatErrors(error.error.errors);
          } else {
            this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour du profil.';
          }
          this.loading = false;
        }
      });
  }

  /**
   * Mettre à jour le mot de passe
   */

onUpdatePassword(): void {
  if (this.passwordForm.invalid || this.passwordForm.hasError('passwordMismatch')) {
    this.markFormGroupTouched(this.passwordForm);
    this.errorMessage = "Les mots de passe ne correspondent pas.";
    return;
  }

  this.loading = true;
  this.clearMessages();

  const passwordData = this.passwordForm.value;

  this.authService.updateProfile(passwordData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Mot de passe mis à jour avec succès.';
          this.passwordForm.reset();
          this.showPasswordSection = false;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du changement de mot de passe:', error);
        if (error.error?.errors) {
          this.errorMessage = this.formatErrors(error.error.errors);
        } else {
          this.errorMessage = error.error?.message || 'Erreur lors du changement de mot de passe.';
        }
        this.loading = false;
      }
    });
}


  /**
   * Basculer l'affichage de la section mot de passe
   */
  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.passwordForm.reset();
      // Réinitialiser aussi la visibilité des mots de passe
      this.showCurrentPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    }
    this.clearMessages();
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('new_password')?.value;
    const confirmPassword = form.get('new_password_confirmation')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }


  /**
   * Basculer la visibilité du mot de passe actuel
   */
/*   toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  } */

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Formater les erreurs de validation
   */
  formatErrors(errors: any): string {
    return Object.values(errors).flat().join(' ');
  }

  /**
   * Effacer les messages
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Retour à la page précédente
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Nettoyage lors de la destruction du composant
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
