import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient, HttpClientXsrfModule } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ContextMenuModule } from '@perfectmemory/ngx-contextmenu';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { CustomFormsModule } from 'projects/tools/src/lib/custom-forms-validators/custom-forms.module';

import { GpLayoutModule } from '../containers/gp-layout/gp-layout.module';

import { NotificationsService } from '@services/notifications.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';
import { AuthGuard } from '../guard/auth.guard';
import { GestoreGuard } from '../guard/gestore.guard';
import { ForbidAnonymousGuard } from '../guard/forbid-anonymous.guard';
import { CategorieGuard } from '../guard/categorie.guard';

import { httpInterceptorProviders } from 'projects/tools/src/lib/interceptors/index';
import { appHttpInterceptorProviders } from '@app/interceptors/index';

import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { DisablePermissionModule } from '@app/directives/disable-permission/disable-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { RemoveHostModule } from '@app/directives/remove-host/remove-host.module';
import { ServiceFiltersModule } from '@app/pipes/service-filters.module';

import { NewsBoxModule } from '../components/news-box/news-box.module';
import { AboutMiniBoxModule } from '../components/about-mini-box/about-mini-box.module';

import { AgidJwtDialogModule } from '../components/authemtications-dialogs/agid-jwt-dialog/agid-jwt-dialog.module';
import { ClientCredentialsDialogModule } from '../components/authemtications-dialogs/client-credentials-dialog/client-credentials-dialog.module';
import { AgidJwtSignatureDialogModule } from '../components/authemtications-dialogs/agid-jwt-signature-dialog/agid-jwt-signature-dialog.module';
import { AgidJwtTrackingEvidenceDialogModule } from '../components/authemtications-dialogs/agid-jwt-tracking-evidence-dialog/agid-jwt-tracking-evidence-dialog.module';
import { CodeGrantDialogModule } from '../components/authemtications-dialogs/code-grant-dialog/code-grant-dialog.module';
import { AgidJwtSignatureTrackingEvidenceDialogModule } from '../components/authemtications-dialogs/agid-jwt-signature-tracking-evidence-dialog/agid-jwt-signature-tracking-evidence-dialog.module';

// Import containers
import {
  GpLayoutComponent,
  GpSidebarNavHelper,
  SimpleLayoutComponent
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

@NgModule({
  declarations: [
    AppComponent,
    ...APP_CONTAINERS
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    HttpClientXsrfModule,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),

    ContextMenuModule.forRoot(),

    VendorsModule,
    ComponentsModule,
    CustomFormsModule,
    HasPermissionModule,
    DisablePermissionModule,
    MarkAsteriskModule,
    RemoveHostModule,
    ServiceFiltersModule,

    NewsBoxModule,
    AboutMiniBoxModule,
    AgidJwtDialogModule,
    ClientCredentialsDialogModule,
    AgidJwtSignatureDialogModule,
    AgidJwtTrackingEvidenceDialogModule,
    CodeGrantDialogModule,
    AgidJwtSignatureTrackingEvidenceDialogModule,

    GpLayoutModule
  ],
  providers: [
    httpInterceptorProviders,
    appHttpInterceptorProviders,
    GpSidebarNavHelper,
    NotificationsService,
    ConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [ConfigService],
      multi: true
    },
    AuthGuard,
    GestoreGuard,
    ForbidAnonymousGuard,
    CategorieGuard
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
