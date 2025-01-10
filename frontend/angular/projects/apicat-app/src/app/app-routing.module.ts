import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { AuthGuard } from '../guard/auth.guard';
import { GestoreGuard } from '../guard/gestore.guard';
import { ForbidAnonymousGuard } from '../guard/forbid-anonymous.guard';

import { GpLayoutComponent, SimpleLayoutComponent } from '../containers';

const routes: Routes = [
  { path: '', redirectTo: '/servizi', pathMatch: 'full' },
  {
    path: 'auth',
    component: SimpleLayoutComponent,
    children: [
      {
        path: 'login',
        loadChildren: () => import('../views/login/login.module').then(m => m.LoginModule)
      },
      {
        path: 'accesso',
        loadChildren: () => import('../views/accesso/accesso.module').then(m => m.AccessoModule)
      }
    ]
  },
  {
    path: 'code-grant-authorization',
    component: SimpleLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('../views/code-grant-authorization/code-grant-authorization.module').then(m => m.CodeGrantAuthorizationModule)
      }
    ]
  },
  {
    path: '',
    component: GpLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '_home',
        loadChildren: () => import('../views/home/home.module').then(m => m.HomeModule),
      },
      {
        path: 'profile',
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'servizi',
        loadChildren: () => import('../views/servizi/servizi.module').then(m => m.ServiziModule)
      },
      {
        path: 'servizi-generici',
        loadChildren: () => import('../views/servizi/servizi.module').then(m => m.ServiziModule)
      },
      {
        path: 'adesioni', 
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/adesioni/adesioni.module').then(m => m.AdesioniModule)
      },
      {
        path: 'notifications',
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../views/notifications/notifications.module').then(m => m.NotificationsModule)
      },
      {
        path: 'soggetti',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/soggetti/soggetti.module').then(m => m.SoggettiModule)
      },
      {
        path: 'dashboard',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'organizzazioni',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/organizzazioni/organizzazioni.module').then(m => m.OrganizzazioniModule)
      },
      {
        path: 'gruppi',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/gruppi/gruppi.module').then(m => m.GruppiModule)
      },
      {
        path: 'domini',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/domini/domini.module').then(m => m.DominiModule)
      },
      {
        path: 'client',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/clients/clients.module').then(m => m.ClientsModule)
      },
      {
        path: 'utenti',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/utenti/utenti.module').then(m => m.UtentiModule)
      },
      {
        path: 'classi-utente',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/classi-utente/classi-utente.module').then(m => m.ClassiUtenteModule)
      },
      {
        path: 'tassonomie',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/taxonomies/taxonomies.module').then(m => m.TaxonomiesModule)
      },
      {
        path: 'pdnd',
        canActivate: [GestoreGuard],
        loadChildren: () => import('../views/pdnd/pdnd.module').then(m => m.PdndModule)
      }
    ]
  },
  { path: '**', redirectTo: 'servizi' }
];

@NgModule({
  imports: [RouterModule.forRoot(
    routes,
    { preloadingStrategy: PreloadAllModules, enableTracing: false }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
