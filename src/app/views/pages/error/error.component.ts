import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './error.component.html',
  //styleUrl: './error.component.scss'
})
export class ErrorComponent implements OnInit {
  type: string = '404';
  title: string = 'Page non trouvée';
  desc: string = 'La page que vous recherchez n\'existe pas.';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Récupérer le type d'erreur depuis l'URL
    this.route.params.subscribe(params => {
      const errorType = params['type'];
      this.setErrorContent(errorType);
    });
  }

  private setErrorContent(errorType: string): void {
    switch (errorType) {
      case '403':
        this.type = '403';
        this.title = 'Accès interdit';
        this.desc = 'Vous n\'avez pas l\'autorisation d\'accéder à cette page.<br>Contactez votre administrateur si vous pensez que c\'est une erreur.';
        break;
      case '500':
        this.type = '500';
        this.title = 'Erreur serveur';
        this.desc = 'Une erreur interne s\'est produite.<br>Veuillez réessayer plus tard.';
        break;
      case '404':
      default:
        this.type = '404';
        this.title = 'Page non trouvée';
        this.desc = 'La page que vous recherchez n\'existe pas.';
        break;
    }
  }
}
