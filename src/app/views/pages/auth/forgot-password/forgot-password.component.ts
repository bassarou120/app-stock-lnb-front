import { NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup,FormBuilder, ReactiveFormsModule,Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ReactiveFormsModule,
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {


    public forgotPasswordForm!: FormGroup ;

  constructor(private formBuilder: FormBuilder,private authService: AuthService,private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/'
    this.forgotPasswordForm = this.formBuilder.group({
      email: ["" ,[Validators.required,Validators.email]],
   });
  }

  onSendOTP() {
  const email = this.forgotPasswordForm.value.email;
  this.authService.sendOTP(email).subscribe({
    next: () => {
      localStorage.setItem('email', email);
      this.router.navigate(['auth/verify-otp']);
    },
    error: () => alert("Email invalide ou inexistant."),
  });
}


}
