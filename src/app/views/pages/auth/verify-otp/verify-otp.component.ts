import { NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup,FormBuilder, ReactiveFormsModule,Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';




@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    NgStyle,
    RouterLink,
    ReactiveFormsModule,
    NgbAlertModule,
    CommonModule
  ],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.scss'
})
export class VerifyOtpComponent implements OnInit {


    public verifyOtpForm!: FormGroup ;

  constructor(private formBuilder: FormBuilder,private authService: AuthService,private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/'
    this.verifyOtpForm = this.formBuilder.group({
      otp_code: ['', [Validators.required]],
      email: [localStorage.getItem('email') || '', Validators.required],
   });
  }

  verifyOTP() {
  const email = this.verifyOtpForm.value.email;
  const otp_code = this.verifyOtpForm.value.otp_code;
  this.authService.verifyOTP(email,otp_code).subscribe({
    next: () => {
      localStorage.setItem('email', email);
      localStorage.setItem('otp_code', otp_code);
      // alert(`Continuons seulement ${localStorage.getItem('email')} ton code est : ${localStorage.getItem('otp_code')}`);
      this.router.navigate(['auth/reset-password']);
    },
    error: () => alert("Code OTP invalide ou inexistant."),
  });
}


}
