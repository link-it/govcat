import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioDetailsComponent } from './servizio-details.component';

import { ForbidAnonymousGuard } from '@app/guard/forbid-anonymous.guard';
import { CategorieGuard } from '@app/guard/categorie.guard';

const routes: Routes = [
{
    path: '',
    children: [
    {
        path: '',
        component: ServizioDetailsComponent
    },
    {
        path: ':id/gruppi',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Gruppi' },
        loadChildren: () => import('../servizio-gruppi/servizio-gruppi.module').then(m => m.ServizioGruppiModule)
    },
    {
        path: ':id/categorie',
        canActivate: [ForbidAnonymousGuard, CategorieGuard],
        data: { breadcrumb: 'Categorie' },
        loadChildren: () => import('../servizio-categorie/servizio-categorie.module').then(m => m.ServizioCategorieModule)
    },
    {
        path: ':id/referenti',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Referenti' },
        loadChildren: () => import('../servizio-referenti/servizio-referenti.module').then(m => m.ServizioReferentiModule)
    },
    {
        path: ':id/comunicazioni',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Comunicazioni' },
        loadChildren: () => import('../servizio-comunicazioni/servizio-comunicazioni.module').then(m => m.ServizioComunicazioniModule)
    },
    {
        path: ':id/allegati',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Allegati' },
        loadChildren: () => import('../servizio-allegati/servizio-allegati.module').then(m => m.ServizioAllegatiModule)
    },
    // {
    //   path: ':id/allegati-specifica',
    //   data: { breadcrumb: 'Allegati specifica' },
    //   loadChildren: () => import('../servizio-allegati/servizio-allegati.module').then(m => m.ServizioAllegatiModule)
    // },
    {
        path: ':id/messaggi',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Messaggi' },
        loadChildren: () => import('../servizio-messaggi/servizio-messaggi.module').then(m => m.ServizioMessaggiModule)
    },
    {
        path: ':id/api',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'API' },
        loadChildren: () => import('../servizio-api/servizio-api.module').then(m => m.ServizioApiModule)
    },
    {
        path: ':id/componenti',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Componenti' },
        loadChildren: () => import('../servizio-componenti/servizio-componenti.module').then(m => m.ServizioComponentiModule)
    },
    {
        path: ':id/transazioni',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Transazioni' },
        loadChildren: () => import('../transazioni/transazioni.module').then(m => m.TransazioniModule)
    },
    {
        path: ':id/statistiche',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Statistiche' },
        loadChildren: () => import('../statistiche/statistiche.module').then(m => m.StatisticheModule)
    },
    {
        path: ':id/verifiche',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Verifiche' },
        loadChildren: () => import('../verifiche/verifiche.module').then(m => m.VerificheModule)
    }
    ]
}
];

@NgModule({
        imports: [RouterModule.forChild(routes)],
        exports: [RouterModule]
})
export class ServizioDetailsRoutingModule {}
