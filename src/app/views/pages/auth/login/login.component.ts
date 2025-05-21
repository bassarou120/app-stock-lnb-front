import { NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { FormGroup,FormBuilder, ReactiveFormsModule,Validators } from "@angular/forms";
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';




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
export class LoginComponent implements OnInit {

  returnUrl: string = '/';
  // returnUrl: any;
    public loginForm!: FormGroup ;

  constructor(private formBuilder: FormBuilder,private authService: AuthService,private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.loginForm = this.formBuilder.group({
      email: ["" ,[Validators.required]],
      password: ["" ,[Validators.required]],
   });
  }

  // onLoggedin(e: Event) {
  //   e.preventDefault();
  //   localStorage.setItem('isLoggedin', 'true');
  //   if (localStorage.getItem('isLoggedin') === 'true') {
  //     this.router.navigate([this.returnUrl]);
  //   }
  // }

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


  

}
