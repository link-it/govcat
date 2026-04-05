/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { Routes } from '@angular/router';

import { AuthGuard } from '../guard/auth.guard';
import { GestoreGuard } from '../guard/gestore.guard';
import { ForbidAnonymousGuard } from '../guard/forbid-anonymous.guard';
import { DashboardGuard } from '../guard/dashboard.guard';
import { RegistrazioneGuard } from '../guard/registrazione.guard';

import { GpLayoutComponent, SimpleLayoutComponent } from '../containers';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    component: SimpleLayoutComponent,
    children: [
      {
        path: 'login',
        loadChildren: () => import('../views/login/login.routes').then(m => m.LOGIN_ROUTES)
      },
      {
        path: 'accesso',
        loadChildren: () => import('../views/accesso/accesso.routes').then(m => m.ACCESSO_ROUTES)
      },
      {
        path: 'registrazione',
        loadChildren: () => import('../views/registrazione/registrazione.routes').then(m => m.REGISTRAZIONE_ROUTES)
      }
    ]
  },
  {
    path: 'code-grant-authorization',
    component: SimpleLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('../views/code-grant-authorization/code-grant-authorization.routes').then(m => m.CODE_GRANT_AUTHORIZATION_ROUTES)
      }
    ]
  },
  {
    path: '',
    component: GpLayoutComponent,
    canActivate: [AuthGuard, RegistrazioneGuard],
    children: [
      {
        path: '_home',
        loadChildren: () => import('../views/home/home.routes').then(m => m.HOME_ROUTES),
      },
      {
        path: 'dashboard',
        canActivate: [DashboardGuard],
        loadChildren: () => import('../views/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'profile',
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'servizi',
        loadChildren: () => import('../views/servizi/servizi.routes').then(m => m.SERVIZI_ROUTES)
      },
      {
        path: 'servizi-generici',
        loadChildren: () => import('../views/servizi/servizi.routes').then(m => m.SERVIZI_ROUTES)
      },
      {
        path: 'adesioni',
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/adesioni/adesioni.routes').then(m => m.ADESIONI_ROUTES)
      },
      {
        path: 'notifications',
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/notifications/notifications.routes').then(m => m.NOTIFICATIONS_ROUTES)
      },
      {
        path: 'soggetti',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/soggetti/soggetti.routes').then(m => m.SOGGETTI_ROUTES)
      },
      {
        path: 'monitoraggio',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/monitoraggio/monitoraggio.routes').then(m => m.MONITORAGGIO_ROUTES)
      },
      {
        path: 'organizzazioni',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/organizzazioni/organizzazioni.routes').then(m => m.ORGANIZZAZIONI_ROUTES)
      },
      {
        path: 'gruppi',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/gruppi/gruppi.routes').then(m => m.GRUPPI_ROUTES)
      },
      {
        path: 'domini',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/domini/domini.routes').then(m => m.DOMINI_ROUTES)
      },
      {
        path: 'client',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/clients/clients.routes').then(m => m.CLIENTS_ROUTES)
      },
      {
        path: 'utenti',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/utenti/utenti.routes').then(m => m.UTENTI_ROUTES)
      },
      {
        path: 'classi-utente',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/classi-utente/classi-utente.routes').then(m => m.CLASSI_UTENTE_ROUTES)
      },
      {
        path: 'tassonomie',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/taxonomies/taxonomies.routes').then(m => m.TAXONOMIES_ROUTES)
      },
      {
        path: 'pdnd',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/pdnd/pdnd.routes').then(m => m.PDND_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'servizi' }
];
