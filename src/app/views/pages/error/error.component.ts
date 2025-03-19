import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {

  type: string | null;
  title: string;
  desc: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.type = this.route.snapshot.paramMap.get('type');
    
    switch(this.type) {
      case '404':
        this.title = 'Page introuvable';
        this.desc = 'Oups !! La page que vous recherchez n\'existe pas.';
        break;
      case '500':
        this.title = 'Erreur interne du serveur';
        this.desc = 'Oups !! Une erreur s\'est produite. Veuillez réessayer plus tard.';
        break;
      default:
        this.type = 'Oups..';
        this.title = 'Quelque chose s\'est mal passé';
        this.desc = 'Il semble qu\'une erreur se soit produite.<br>' + 'Nous y travaillons.';
    }
    
  }

}
