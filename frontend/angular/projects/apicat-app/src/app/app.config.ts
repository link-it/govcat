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
import { ApplicationConfig, CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration, HttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { FALLBACK, GravatarConfig, GravatarModule, RATING } from 'ngx-gravatar';

import { routes } from './app.routes';
import { ConfigService, httpInterceptorProviders, BreadcrumbService } from '@linkit/components';
import { appHttpInterceptorProviders } from '@app/interceptors/index';
import { GpSidebarNavHelper } from '../containers';
import { NotificationsService } from '@services/notifications.service';
import { AuthGuard } from '../guard/auth.guard';
import { GestoreGuard } from '../guard/gestore.guard';
import { ForbidAnonymousGuard } from '../guard/forbid-anonymous.guard';
import { DashboardGuard } from '../guard/dashboard.guard';
import { CategorieGuard } from '../guard/categorie.guard';
import { MonitoraggioGuard } from '../guard/monitoraggio.guard';
import { RegistrazioneGuard } from '../guard/registrazione.guard';
import { environment } from '../environments/environment';

const gravatarConfig: GravatarConfig = {
  fallback: FALLBACK.mm,
  rating: RATING.g,
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderColor: 'rgba(255, 255, 255, 1)',
  hasBorder: true,
};

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({ headerName: 'X-XSRF-TOKEN', cookieName: 'XSRF-TOKEN' })
    ),
    provideAnimationsAsync(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      MarkdownModule.forRoot(),
      OAuthModule.forRoot(),
      TooltipModule.forRoot(),
      ModalModule.forRoot(),
      BsDatepickerModule.forRoot(),
      GravatarModule.forRoot(gravatarConfig)
    ),
    BreadcrumbService,
    ...httpInterceptorProviders,
    appHttpInterceptorProviders,
    GpSidebarNavHelper,
    NotificationsService,
    ConfigService,
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.load(environment.configFile);
    }),
    AuthGuard,
    GestoreGuard,
    ForbidAnonymousGuard,
    DashboardGuard,
    CategorieGuard,
    MonitoraggioGuard,
    RegistrazioneGuard,
    { provide: OAuthStorage, useFactory: () => localStorage }
  ]
};
