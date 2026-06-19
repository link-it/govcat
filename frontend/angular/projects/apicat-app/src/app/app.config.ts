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
import { ApplicationConfig, CSP_NONCE, Injector, importProvidersFrom, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
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

import { routes } from './app.routes';
import { ConfigService, httpInterceptorProviders, BreadcrumbService, Tools } from '@linkit/components';
import { TranslateService } from '@ngx-translate/core';
import { appHttpInterceptorProviders } from '@app/interceptors/index';
import { GpSidebarNavHelper } from '../containers';
import { NotificationsService } from '@services/notifications.service';
import { AuthenticationService } from '@services/authentication.service';
import { AuthGuard } from '../guard/auth.guard';
import { GestoreGuard } from '../guard/gestore.guard';
import { ForbidAnonymousGuard } from '../guard/forbid-anonymous.guard';
import { DashboardGuard } from '../guard/dashboard.guard';
import { CategorieGuard } from '../guard/categorie.guard';
import { MonitoraggioGuard } from '../guard/monitoraggio.guard';
import { RegistrazioneGuard } from '../guard/registrazione.guard';
import { OrganizationSelectionGuard } from '../guard/organization-selection.guard';
import { environment } from '../environments/environment';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function cspNonceFactory(): string {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('meta[name="CSP-Nonce"]');
  return el?.getAttribute('content') ?? '';
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
      BsDatepickerModule.forRoot()
    ),
    BreadcrumbService,
    ...httpInterceptorProviders,
    appHttpInterceptorProviders,
    GpSidebarNavHelper,
    NotificationsService,
    ConfigService,
    provideAppInitializer(() => {
      // Carichiamo configurazione + OAuth, poi pre-loadiamo
      // `/profilo` cosi` che i guard sincroni di routing
      // (`DashboardGuard`, `OrganizationSelectionGuard`, ecc.)
      // trovino la sessione gia` popolata al primo activation.
      // Senza questo preload, in incognito la prima activation
      // della rotta protetta `''` falliva il check di sessione
      // (race con `loadProfile` async del layout) e
      // l'utente veniva dirottato a `/servizi` invece che a
      // `/dashboard`.
      //
      // Nota: `AuthenticationService` viene istanziato via
      // `Injector` DOPO il load — il suo constructor legge
      // `configService.getAppConfig()` che e` populato solo
      // a quel punto. Iniettarlo eager qui causerebbe un
      // TypeError sull'accesso `config.AppConfig`.
      const configService = inject(ConfigService);
      const injector = inject(Injector);
      // `Tools` espone metodi statici (es. `GetErrorMsg`) che
      // traducono chiavi i18n del BE via `Tools.translate`. Il
      // suo costruttore non viene mai invocato a runtime (nessun
      // componente lo inietta come DI), quindi inizializziamo
      // qui il membro statico manualmente.
      Tools.translate = injector.get(TranslateService);
      return configService.load(environment.configFile)
        .then(() => injector.get(AuthenticationService).loadAndStoreProfile());
    }),
    AuthGuard,
    GestoreGuard,
    ForbidAnonymousGuard,
    DashboardGuard,
    CategorieGuard,
    MonitoraggioGuard,
    RegistrazioneGuard,
    OrganizationSelectionGuard,
    { provide: OAuthStorage, useFactory: () => localStorage },
    { provide: CSP_NONCE, useFactory: cspNonceFactory }
  ]
};
