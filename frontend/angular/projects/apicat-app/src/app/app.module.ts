import { CUSTOM_ELEMENTS_SCHEMA, NgModule, inject, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgSelectModule } from '@ng-select/ng-select';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { environment } from '../environments/environment';

import { ComponentsModule, ConfigService, httpInterceptorProviders } from '@linkit/components';

import { GpLayoutModule } from '../containers/gp-layout/gp-layout.module';

import { NotificationsService } from '@services/notifications.service';
import { AuthGuard } from '../guard';
import { GestoreGuard } from '@app/guard/gestore.guard';
import { ForbidAnonymousGuard } from '@app/guard/forbid-anonymous.guard';
import { CategorieGuard } from '@app/guard/categorie.guard';
import { MonitoraggioGuard } from '@app/guard/monitoraggio.guard';

import { appHttpInterceptorProviders } from '@app/interceptors/index';

import { HasPermissionModule } from '../directives/has-permission/has-permission.module';
import { DisablePermissionModule } from '@app/directives/disable-permission/disable-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk';
import { RemoveHostModule } from '@app/directives/remove-host/remove-host.module';
import { ServiceFiltersModule } from '@app/pipes/service-filters.module';

import { NewsBoxModule } from '../components/news-box/news-box.module';
import { AboutMiniBoxModule } from '../components/about-mini-box/about-mini-box.module';

import { AgidJwtDialogModule } from '@app/components/authemtications-dialogs/agid-jwt-dialog/agid-jwt-dialog.module';
import { AgidJwtSignatureDialogModule } from '@app/components/authemtications-dialogs/agid-jwt-signature-dialog/agid-jwt-signature-dialog.module';
import { AgidJwtSignatureTrackingEvidenceDialogModule } from '@app/components/authemtications-dialogs/agid-jwt-signature-tracking-evidence-dialog/agid-jwt-signature-tracking-evidence-dialog.module';
import { AgidJwtTrackingEvidenceDialogModule } from '@app/components/authemtications-dialogs/agid-jwt-tracking-evidence-dialog/agid-jwt-tracking-evidence-dialog.module';
import { ClientCredentialsDialogModule } from '@app/components/authemtications-dialogs/client-credentials-dialog/client-credentials-dialog.module';
import { CodeGrantDialogModule } from '@app/components/authemtications-dialogs/code-grant-dialog/code-grant-dialog.module';

import {
  GpLayoutComponent,
  GpSidebarNavHelper,
  SimpleLayoutComponent,
} from '../containers';

const APP_CONTAINERS = [
  GpLayoutComponent,
  SimpleLayoutComponent
];

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function ConfigLoader(configService: ConfigService) {
  return () => configService.load(environment.configFile);
}

export function storageFactory() : OAuthStorage {
  return localStorage
}

@NgModule({
  declarations: [
    AppComponent,
    ...APP_CONTAINERS
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    MarkdownModule.forRoot(),
    OAuthModule.forRoot(),

    ComponentsModule,
    NgSelectModule,
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    HasPermissionModule,
    DisablePermissionModule,
    MarkAsteriskModule,
    RemoveHostModule,
    ServiceFiltersModule,

    NewsBoxModule,
    AboutMiniBoxModule,
    RemoveHostModule,
    AgidJwtDialogModule,
    ClientCredentialsDialogModule,
    AgidJwtSignatureDialogModule,
    AgidJwtTrackingEvidenceDialogModule,
    CodeGrantDialogModule,
    AgidJwtSignatureTrackingEvidenceDialogModule,

    GpLayoutModule
  ],
  providers: [
    ...httpInterceptorProviders,
    appHttpInterceptorProviders,
    GpSidebarNavHelper,
    NotificationsService,
    ConfigService,
    provideAppInitializer(() => {
      const initializerFn = (ConfigLoader)(inject(ConfigService));
      return initializerFn();
    }),
    provideHttpClient(withInterceptorsFromDi(), withXsrfConfiguration({ headerName: 'X-XSRF-TOKEN', cookieName: 'XSRF-TOKEN' })),
    AuthGuard,
    GestoreGuard,
    ForbidAnonymousGuard,
    CategorieGuard,
    MonitoraggioGuard,
    { provide: OAuthStorage, useFactory: storageFactory }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }

