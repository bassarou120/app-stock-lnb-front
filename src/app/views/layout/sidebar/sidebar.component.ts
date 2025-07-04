import { DOCUMENT, NgClass } from '@angular/common';
import { OnDestroy } from '@angular/core';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { NgScrollbar } from 'ngx-scrollbar';
import MetisMenu from 'metismenujs';

import { MENU } from './menu';
import { MenuItem } from './menu.model';

import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { SiteSettingsService } from '../../../core/services/site-settings/site-settings.service'; // NOUVEL IMPORT
import { Subject, takeUntil } from 'rxjs'; // NOUVEAUX IMPORTS POUR GÉRER LES OBSERVABLES

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgScrollbar,
    NgClass,
    FeatherIconDirective,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sidebarToggler') sidebarToggler: ElementRef;

  menuItems: MenuItem[] = [];
  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;

  // PROPRIÉTÉS POUR LE LOGO ET LE NOM DU SITE (AJOUTÉES)
  siteName: string = 'Chargement...';
  logoUrl: string = 'images/logo2.png'; // Placeholder par défaut

  permissions: any[] = [];
  accessibleModules: string[] = [];
  accessibleFonctionnalites: string[] = [];
  filteredMenu: MenuItem[] = [];
  private permissionListener: any;
  private destroy$ = new Subject<void>(); // Subject pour gérer la désinscription des observables

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router, // Garder router ici pour la logique existante
    private siteSettingsService: SiteSettingsService // INJECTION DU SERVICE
  ) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        /**
         * Activating the current active item dropdown
         */
        this._activateMenuDropdown();

        /**
         * closing the sidebar
         */
        if (window.matchMedia('(max-width: 991px)').matches) {
          this.document.body.classList.remove('sidebar-open');
        }
      }
    });
  }

  ngOnInit(): void {
    this.menuItems = MENU;

    /**
     * Sidebar-folded on desktop (min-width:992px and max-width: 1199px)
     */
    const desktopMedium = window.matchMedia(
      '(min-width:992px) and (max-width: 1199px)'
    );
    desktopMedium.addEventListener('change', () => {
      this.iconSidebar;
    });
    this.iconSidebar(desktopMedium);

    console.log('🔄 Sidebar ngOnInit');

    // Charger le menu au démarrage
    this.loadFilteredMenu();

    // S'abonner aux changements des paramètres du site (AJOUTÉ)
/*     this.siteSettingsService.siteSettings$.pipe(
      takeUntil(this.destroy$) // Gérer la désinscription
    ).subscribe(settings => {
      this.siteName = settings.companyName;
      this.logoUrl = settings.logoUrl;
      console.log('SidebarComponent: Logo et nom du site mis à jour:', { name: this.siteName, logo: this.logoUrl });
    }); */


    // S'abonner aux changements des paramètres du site
  this.siteSettingsService.siteSettings$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(settings => {
    this.siteName = settings.companyName;
    this.logoUrl = settings.logoUrl;
    console.log('SidebarComponent: Logo et nom du site mis à jour:', { name: this.siteName, logo: this.logoUrl });
  });


    // Écouter les mises à jour de permissions
    this.permissionListener = (event: any) => {
      console.log('🔄 Sidebar: Permissions mises à jour');
      this.loadFilteredMenu();
    };

    // 🔥 Écouter les deux événements
    window.addEventListener('permissionsLoaded', this.permissionListener);
    window.addEventListener('permissionsUpdated', this.permissionListener);
  }

  // � NOUVEAU : Nettoyer les écouteurs d'événements ET les abonnements RxJS
  ngOnDestroy(): void {
    if (this.permissionListener) {
      window.removeEventListener('permissionsLoaded', this.permissionListener);
      window.removeEventListener('permissionsUpdated', this.permissionListener);
    }
    this.destroy$.next(); // Émet une valeur pour désinscrire tous les abonnements RxJS
    this.destroy$.complete(); // Complète le Subject
  }

  private loadFilteredMenu(): void {
    try {
      const allowedModulesStr = localStorage.getItem('allowedModules');
      const permissionsStr = localStorage.getItem('permissions');

      if (!allowedModulesStr || !permissionsStr) {
        console.log('⚠️ Pas de données - Menu complet');
        this.filteredMenu = MENU;
        return;
      }

      const allowedModules: string[] = JSON.parse(allowedModulesStr);
      const permissions: any[] = JSON.parse(permissionsStr);

      // Extraire les fonctionnalités
      const allowedFonctionnalites: string[] = [];
      permissions.forEach(permission => {
        if (permission.fonctionnalite && permission.fonctionnalite.libelle_fonctionnalite) {
          const fonctionnaliteName = permission.fonctionnalite.libelle_fonctionnalite;
          if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
            allowedFonctionnalites.push(fonctionnaliteName);
          }
        }
      });

      console.log('📋 Modules autorisés:', allowedModules);
      console.log('📋 Fonctionnalités autorisées (extraites):', allowedFonctionnalites);

      localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites));

      if (allowedModules.length === 0) {
        this.filteredMenu = MENU.filter(item =>
          item.label === 'Menu principal' ||
          item.label === 'Tableau de Bord'
        );
        return;
      }

      this.filteredMenu = this.createFilteredMenu(MENU, allowedModules, allowedFonctionnalites);

      console.log('🎯 Menu filtré final:', this.filteredMenu.map(m => `${m.isTitle ? '[TITRE]' : ''} ${m.label}`));

    } catch (error) {
      console.error('❌ Erreur filtrage menu:', error);
      this.filteredMenu = MENU;
    }
  }

  private createFilteredMenu(originalMenu: MenuItem[], allowedModules: string[], allowedFonctionnalites: string[]): MenuItem[] {
    const filteredMenu: MenuItem[] = [];
    const accessibleItems: MenuItem[] = [];

    originalMenu.forEach(item => {
      if (item.label === 'Menu principal' || item.label === 'Tableau de Bord') {
        accessibleItems.push(item);
        return;
      }

      if (item.isTitle) {
        return;
      }

      let hasAccess = false;
      let newItem: MenuItem = { ...item };

      if (item.fonctionnalites && item.fonctionnalites.length > 0) {
        hasAccess = item.fonctionnalites.some(fonct =>
          allowedFonctionnalites.includes(fonct)
        );
        console.log(`🔍 ${item.label} (${item.fonctionnalites.join(', ')}): ${hasAccess ? '✅' : '❌'}`);
      }
      else if (item.subItems && item.subItems.length > 0) {
        console.log(`🔍 ANALYSE SOUS-MENU "${item.label}"`);

        const accessibleSubItems: MenuItem[] = [];

        item.subItems.forEach(subItem => {
          let subHasAccess = true;

          if (subItem.fonctionnalites && subItem.fonctionnalites.length > 0) {
            subHasAccess = subItem.fonctionnalites.some(fonct =>
              allowedFonctionnalites.includes(fonct)
            );
            console.log(`   📄 ${subItem.label} (${subItem.fonctionnalites.join(', ')}): ${subHasAccess ? '✅' : '❌'}`);
          } else {
            console.log(`   📄 ${subItem.label}: ✅ (pas de restriction)`);
          }

          if (subHasAccess) {
            accessibleSubItems.push({ ...subItem });
          }
        });

        if (accessibleSubItems.length > 0) {
          newItem = { ...item, subItems: accessibleSubItems };
          hasAccess = true;
          console.log(`   ✅ "${item.label}" accessible avec ${accessibleSubItems.length} sous-menu(s)`);
        } else {
          console.log(`   ❌ "${item.label}" inaccessible (aucun sous-menu)`);
        }
      }
      else if (item.module && !item.fonctionnalites) {
        hasAccess = allowedModules.includes(item.module);
        console.log(`🔍 ${item.label} (module: ${item.module}): ${hasAccess ? '✅' : '❌'}`);
      }

      if (hasAccess) {
        accessibleItems.push(newItem);
      }
    });

    originalMenu.forEach(item => {
      if (item.isTitle) {
        if (item.module) {
          const hasAccessibleItemsInModule = accessibleItems.some(accessibleItem =>
            accessibleItem.module === item.module
          );

          if (hasAccessibleItemsInModule) {
            console.log(`📁 Titre "${item.label}" ajouté`);
            filteredMenu.push({ ...item });
          } else {
            console.log(`🚫 Titre "${item.label}" masqué`);
          }
        } else {
          filteredMenu.push({ ...item });
        }
      } else {
        const accessibleItem = accessibleItems.find(accItem =>
          accItem.label === item.label && accItem.module === item.module
        );

        if (accessibleItem) {
          filteredMenu.push(accessibleItem);
        }
      }
    });

    return filteredMenu;
  }

  private hasAccessToMenuItem(item: MenuItem, allowedFonctionnalites: string[]): boolean {
    if (!item.fonctionnalites || item.fonctionnalites.length === 0) {
      return true;
    }

    const hasAccess = item.fonctionnalites.some(fonct =>
      allowedFonctionnalites.includes(fonct)
    );

    console.log(`🔍 Accès à "${item.label}": ${hasAccess ? '✅' : '❌'} (Fonctionnalités: ${item.fonctionnalites.join(', ')})`);

    return hasAccess;
  }

  filterMenuByPermissions(): MenuItem[] {
    const modulesAutorisés = this.accessibleModules.map(m => m.toLowerCase());

    const menusFiltrés = MENU.filter(menu => {
      if (menu.module) {
        return modulesAutorisés.includes(menu.module.toLowerCase());
      }
      if (!menu.module && !menu.isTitle) {
        return true;
      }
      return false;
    });

    const finalMenu: MenuItem[] = [];

    for (let i = 0; i < MENU.length; i++) {
      const item = MENU[i];

      if (item.isTitle && item.module) {
        const moduleTitle = item.module.toLowerCase();
        const hasChildren = menusFiltrés.some(m => m.module?.toLowerCase() === moduleTitle && !m.isTitle);
        if (hasChildren) {
          finalMenu.push(item);
        }
      } else if (menusFiltrés.includes(item)) {
        finalMenu.push(item);
      }
    }

    return finalMenu;
  }

  ngAfterViewInit() {
    new MetisMenu(this.sidebarMenu.nativeElement);
    this._activateMenuDropdown();
  }

  toggleSidebar(e: Event) {
    this.sidebarToggler.nativeElement.classList.toggle('active');
    if (window.matchMedia('(min-width: 992px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-folded');
    } else if (window.matchMedia('(max-width: 991px)').matches) {
      e.preventDefault();
      this.document.body.classList.toggle('sidebar-open');
    }
  }

  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.add('open-sidebar-folded');
    }
  }

  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.remove('open-sidebar-folded');
    }
  }

  iconSidebar(mq: MediaQueryList) {
    if (mq.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
  }

  hasItems(item: MenuItem) {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

  _activateMenuDropdown() {
    this.resetMenuItems();
    this.activateMenuItems();
  }

  resetMenuItems() {
    const links = document.getElementsByClassName('nav-link-ref');

    for (let i = 0; i < links.length; i++) {
      const menuItemEl = links[i];
      this.renderer.removeClass(menuItemEl, 'mm-active');
      const parentEl = menuItemEl.parentElement;

      if (parentEl) {
        this.renderer.removeClass(parentEl, 'mm-active');
        const parent2El = parentEl.parentElement;

        if (parent2El) {
          this.renderer.removeClass(parent2El, 'mm-show');
        }

        const parent3El = parent2El?.parentElement;
        if (parent3El) {
          this.renderer.removeClass(parent3El, 'mm-active');

          if (parent3El.classList.contains('side-nav-item')) {
            const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');

            if (firstAnchor) {
              this.renderer.removeClass(firstAnchor, 'mm-active');
            }
          }

          const parent4El = parent3El.parentElement;
          if (parent4El) {
            this.renderer.removeClass(parent4El, 'mm-show');

            const parent5El = parent4El.parentElement;
            if (parent5El) {
              this.renderer.removeClass(parent5El, 'mm-active');
            }
          }
        }
      }
    }
  }

  activateMenuItems() {
    const links: any = document.getElementsByClassName('nav-link-ref');

    let menuItemEl = null;

    for (let i = 0; i < links.length; i++) {
      if (window.location.pathname === links[i]['pathname']) {
        menuItemEl = links[i];
        break;
      }
    }

    if (menuItemEl) {
      menuItemEl.classList.add('mm-active');
      const parentEl = menuItemEl.parentElement;

      if (parentEl) {
        parentEl.classList.add('mm-active');

        const parent2El = parentEl.parentElement;
        if (parent2El) {
          parent2El.classList.add('mm-show');
        }

        const parent3El = parent2El.parentElement;
        if (parent3El) {
          parent3El.classList.add('mm-active');

          if (parent3El.classList.contains('side-nav-item')) {
            const firstAnchor = parent3El.querySelector('.side-nav-link-a-ref');

            if (firstAnchor) {
              firstAnchor.classList.add('mm-active');
            }
          }

          const parent4El = parent3El.parentElement;
          if (parent4El) {
            parent4El.classList.add('mm-show');

            const parent5El = parent4El.parentElement;
            if (parent5El) {
              parent5El.classList.add('mm-active');
            }
          }
        }
      }
    }
  }
}
