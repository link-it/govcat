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

import { ServizioDetailsComponent } from './servizio-details.component';

import { ForbidAnonymousGuard } from '@app/guard/forbid-anonymous.guard';
import { CategorieGuard } from '@app/guard/categorie.guard';
import { MonitoraggioGuard } from '@app/guard/monitoraggio.guard';

export const SERVIZIO_DETAILS_ROUTES: Routes = [
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
                loadChildren: () => import('../servizio-gruppi/servizio-gruppi.routes').then(m => m.SERVIZIO_GRUPPI_ROUTES)
            },
            {
                path: ':id/categorie',
                canActivate: [ForbidAnonymousGuard, CategorieGuard],
                data: { breadcrumb: 'Categorie' },
                loadChildren: () => import('../servizio-categorie/servizio-categorie.routes').then(m => m.SERVIZIO_CATEGORIE_ROUTES)
            },
            {
                path: ':id/referenti',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'Referenti' },
                loadChildren: () => import('../servizio-referenti/servizio-referenti.routes').then(m => m.SERVIZIO_REFERENTI_ROUTES)
            },
            {
                path: ':id/comunicazioni',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'Comunicazioni' },
                loadChildren: () => import('../servizio-comunicazioni/servizio-comunicazioni.routes').then(m => m.SERVIZIO_COMUNICAZIONI_ROUTES)
            },
            {
                path: ':id/allegati',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'Allegati' },
                loadChildren: () => import('../servizio-allegati/servizio-allegati.routes').then(m => m.SERVIZIO_ALLEGATI_ROUTES)
            },
            // {
            //   path: ':id/allegati-specifica',
            //   data: { breadcrumb: 'Allegati specifica' },
            //   loadChildren: () => import('../servizio-allegati/servizio-allegati.routes').then(m => m.SERVIZIO_ALLEGATI_ROUTES)
            // },
            {
                path: ':id/messaggi',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'Messaggi' },
                loadChildren: () => import('../servizio-messaggi/servizio-messaggi.routes').then(m => m.SERVIZIO_MESSAGGI_ROUTES)
            },
            {
                path: ':id/api',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'API' },
                loadChildren: () => import('../servizio-api/servizio-api.routes').then(m => m.SERVIZIO_API_ROUTES)
            },
            {
                path: ':id/componenti',
                canActivate: [ForbidAnonymousGuard],
                data: { breadcrumb: 'Componenti' },
                loadChildren: () => import('../servizio-componenti/servizio-componenti.routes').then(m => m.SERVIZIO_COMPONENTI_ROUTES)
            },
            {
                path: ':id/transazioni',
                canActivate: [ForbidAnonymousGuard, MonitoraggioGuard],
                data: { breadcrumb: 'Transazioni' },
                loadChildren: () => import('../transazioni/transazioni.routes').then(m => m.TRANSAZIONI_ROUTES)
            },
            {
                path: ':id/statistiche',
                canActivate: [ForbidAnonymousGuard, MonitoraggioGuard],
                data: { breadcrumb: 'Statistiche' },
                loadChildren: () => import('../statistiche/statistiche.routes').then(m => m.STATISTICHE_ROUTES)
            },
            {
                path: ':id/verifiche',
                canActivate: [ForbidAnonymousGuard, MonitoraggioGuard],
                data: { breadcrumb: 'Verifiche' },
                loadChildren: () => import('../verifiche/verifiche.routes').then(m => m.VERIFICHE_ROUTES)
            }
        ]
    }
];
