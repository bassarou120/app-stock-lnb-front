import { NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ReactiveFormsModule,
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {


  public resetPasswordForm!: FormGroup;
  alertVisible: boolean = false;  // Pour gérer la visibilité de l'alerte

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/'
    this.resetPasswordForm = this.formBuilder.group({
      email: [localStorage.getItem('email') || '', Validators.required],
      otp_code: [localStorage.getItem('otp_code') || '', Validators.required],
      password: ['', [Validators.required,Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required,Validators.minLength(8)]],
    });
  }

  resetPassword() {
    const spinner = document.querySelector('.spinner-border');
    if (this.resetPasswordForm.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.authService.resetPassword(this.resetPasswordForm.value).subscribe({
        next: () => {
          this.alertVisible = true; // Affiche l’alerte
        setTimeout(() => {
          this.alertVisible = false; // Masque après 3 secondes
          this.router.navigate(['auth/login']);
        }, 3000);

        localStorage.removeItem('email');
        localStorage.removeItem('otp_code');
        },
        error: () => {
          if (spinner) spinner.classList.add('d-none');
          alert("Une erreur s'est produite")
        },
      });
    }else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }


}
