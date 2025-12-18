import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings.service';
import { Subject, takeUntil } from 'rxjs';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive'; // Assurez-vous du bon chemin
import { DynamicThemeService } from '../../../core/services/dynamic-theme/dynamic-theme.service';
import { ThemeCssVariableService } from '../../../core/services/theme-css-variable.service';


@Component({
  selector: 'app-site-settings',
  templateUrl: './site-settings.component.html',
  styleUrls: ['./site-settings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbAlertModule,
    FeatherIconDirective
  ],

})
export class SiteSettingsComponent implements OnInit, OnDestroy {
  siteSettingsForm!: FormGroup;
  siteName: string = 'Nom du Site';
  logoUrl: string = 'assets/images/logo_bg.png';
  previewLogoUrl: string | ArrayBuffer | null = null;
  newLogoFile: File | null = null;

  // MODIFIÉ: Initialisation de la couleur principale en vert
  //mainColor: string = '#00993E'; // Couleur principale actuellement sauvegardée (Vert Bootstrap)
  //newMainColor: string = '#00993E'; // Couleur sélectionnée dans le champ de saisie

  loading: boolean = true;
  isSaving: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;

// Propriétés pour les couleurs dynamiques
  currentThemeColors: any = {};
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private siteSettingsService: SiteSettingsService,
    private dynamicThemeService: DynamicThemeService,
    private themeCssVariableService: ThemeCssVariableService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadSettings();
     // Écouter les changements de couleurs en temps réel
    this.dynamicThemeService.colors$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(colors => {
      if (colors) {
        this.currentThemeColors = colors;
        console.log('🎨 Couleurs mises à jour dans site-settings:', colors);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.siteSettingsForm = this.fb.group({
      siteName: ['', Validators.required],
      logoFile: [null],
      // MODIFIÉ: Initialisation du formulaire avec la couleur verte
      mainColor: ['#00993E', Validators.required] // Initialisation avec une couleur verte par défaut
    });
  }

  /**
   * Charge les paramètres du site depuis le backend.
   */
  loadSettings(): void {
    console.log("hahah");
    this.loading = true;
    this.error = null;
    this.siteSettingsService.getSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        console.log('Paramètres reçus du backend:', settings);
        const companyNameSetting = settings.find(s => s.key === 'company_name');
        const logoUrlSetting = settings.find(s => s.key === 'logo_url');
        // const mainColorSetting = settings.find(s => s.key === 'main_color');

        // Mettre à jour les états affichés
        this.siteName = companyNameSetting?.value || 'Nom du Site';
        // this.logoUrl = logoUrlSetting?.value ? logoUrlSetting.value : 'assets/images/logo_bg.png';
        this.logoUrl = logoUrlSetting?.value ? this.siteSettingsService.getPublicStorageUrl(logoUrlSetting.value) : 'assets/images/logo_bg.png';
        // MODIFIÉ: Utilisation de la couleur verte par défaut si non trouvée
        console.log("site logo url", this.logoUrl);
        //this.mainColor = mainColorSetting?.value || '#00993E'; // Mettre à jour la couleur principale

        // Mettre à jour les valeurs du formulaire
        this.siteSettingsForm.patchValue({
          siteName: this.siteName,
          //mainColor: this.mainColor
        });
        this.previewLogoUrl = this.logoUrl;
        this.newLogoFile = null;
        //this.newMainColor = this.mainColor; // Initialise la couleur du sélecteur avec la couleur actuelle

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des paramètres:', err);
        this.error = `Échec du chargement des paramètres: ${err.message || 'Vérifiez la console.'}`;
        this.loading = false;
      }
    });
  }

  /**
   * Gère la sélection d'un fichier logo.
   * Convertit le fichier en URL de données pour l'aperçu.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newLogoFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewLogoUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      this.newLogoFile = null;
      this.previewLogoUrl = this.logoUrl;
    }
  }

  /**
   * Efface le logo sélectionné ou actuel.
   */
  onClearLogo(): void {
    this.newLogoFile = null;
    this.previewLogoUrl = null;
    this.siteSettingsForm.get('logoFile')?.setValue(null);
  }

  /**
   * Gère le changement de couleur dans le sélecteur de couleur.
   */
/*   onMainColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newMainColor = input.value;
  } */


    onMainColorChange(event: any): void {
    const newColor = event.target.value;
    // Aperçu en temps réel (optionnel)
    this.dynamicThemeService.updateColor('primary_color', newColor);
  }


  // Fichier : site-settings.component.ts

/**
 * Soumet le formulaire pour enregistrer les paramètres.
 */
async onSubmit(): Promise<void> {
  if (this.siteSettingsForm.invalid) {
    this.markFormGroupTouched(this.siteSettingsForm);
    this.showTemporaryMessage('error', 'Veuillez remplir tous les champs obligatoires.');
    return;
  }

  this.isSaving = true;
  this.error = null;
  this.successMessage = null;

  const siteNameValue = this.siteSettingsForm.get('siteName')?.value;
  const mainColorValue = this.siteSettingsForm.get('mainColor')?.value;
  let finalLogoUrl = this.logoUrl; // Commence avec l'URL actuelle

  try {
    // 1. Sauvegarder le nom du site
    await this.siteSettingsService.saveSetting('company_name', siteNameValue, 'text').toPromise();
    console.log('Nom du site enregistré.');

    // 2. Sauvegarder la couleur principale
    await this.siteSettingsService.saveSetting('main_color', mainColorValue, 'text').toPromise();
    console.log('Couleur principale enregistrée.');

    // 💡 ACTION IMMÉDIATE : Mise à jour du thème CSS
    this.dynamicThemeService.updateColor('primary_color', mainColorValue);


    // 3. Gérer le logo
    if (this.newLogoFile) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(this.newLogoFile as File);
      });
      const base64Image = await base64Promise;

      // Capture de la réponse de l'API pour obtenir la nouvelle URL complète
      const logoRes: any = await this.siteSettingsService.saveSetting('logo_url', base64Image, 'base64_image').toPromise();
      console.log('Nouveau logo enregistré.');
      
      // Récupération de l'URL du logo à partir de la réponse du backend
      finalLogoUrl = logoRes?.data?.value || this.previewLogoUrl;
      
    } else if (this.previewLogoUrl === null && this.logoUrl !== 'public/images/logo_bg.png') {
      
      await this.siteSettingsService.saveSetting('logo_url', '', 'base64_image').toPromise();
      console.log('Logo supprimé.');
      finalLogoUrl = ''; 
    }

    // --- 🛑 DIFFUSION UNIQUE ET GLOBALE ---
    
    // Mise à jour des propriétés locales pour le formulaire
    this.logoUrl = finalLogoUrl;
    this.previewLogoUrl = finalLogoUrl; 
    this.siteName = siteNameValue;

    // 💡 DIFFUSION AU SERVICE : C'est cet appel unique qui met à jour le Header/Sidebar
    this.siteSettingsService.updateLocalSettings({
        companyName: siteNameValue,
        logoUrl: finalLogoUrl,
        mainColor: mainColorValue
    } as any);

    // --- FIN DE LA DIFFUSION ---

    this.showTemporaryMessage('success', 'Paramètres enregistrés avec succès !');
    // Recharger pour réinitialiser le formulaire localement (optionnel mais sécurisant)
    this.loadSettings(); 

  } catch (err: any) {
      // ... (gestion des erreurs)
  } finally {
      this.isSaving = false;
  }
}

  //   private saveColorSetting(key: string, color: string): void {
  //   // Appel à votre API pour sauvegarder
  //   // Puis mettre à jour le thème
  //   this.dynamicThemeService.updateColor('primary_color', color);

  //   this.isSaving = false;
  //   this.successMessage = 'Couleur mise à jour avec succès !';

  //   // Effacer le message après 3 secondes
  //   setTimeout(() => {
  //     this.successMessage = '';
  //   }, 3000);
  // }


  /**
   * Affiche un message temporaire (succès ou erreur).
   */
  showTemporaryMessage(type: 'success' | 'error', message: string): void {
    if (type === 'success') {
      this.successMessage = message;
      this.error = null;
    } else {
      this.error = message;
      this.successMessage = null;
    }
    setTimeout(() => {
      this.successMessage = null;
      this.error = null;
    }, 3000);
  }

  /**
   * Marque tous les contrôles d'un FormGroup comme 'touchés' pour afficher les erreurs de validation.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
