import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { provideHighlightOptions } from 'ngx-highlightjs';

// NOUVEAU: Importez les fonctions nécessaires pour la locale
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr'; // Importe les données de la locale française
import { LOCALE_ID } from '@angular/core'; // Pour définir la locale par défaut


// NOUVEAU: Enregistrez les données de la locale
registerLocaleData(localeFr);


const highlightOptions = {
  coreLibraryLoader: () => import('highlight.js/lib/core'),
  languages: {
    typescript: () => import('highlight.js/lib/languages/typescript'),
    scss: () => import('highlight.js/lib/languages/scss'),
    xml: () => import('highlight.js/lib/languages/xml')
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })), 
    provideHttpClient(),
    provideAnimationsAsync(),
    importProvidersFrom([SweetAlert2Module.forRoot()]), 
    provideHighlightOptions(highlightOptions), 
    // NOUVEAU: Fournir la locale par défaut pour les pipes
    { provide: LOCALE_ID, useValue: 'fr' } 
  ],
};
