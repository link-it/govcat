import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
// import { BackWebModule } from '../components/back-web/back-web.module';

import { VerificheComponent } from './verifiche.component';
import { VerificheRoutingModule } from './verifiche-routing.module';
import { VerificaSoggettoTokenModule } from './verifica-soggetto-token/verifica-soggetto-token.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // BackWebModule,
    VerificheRoutingModule,
    VerificaSoggettoTokenModule
  ],
  declarations: [
    VerificheComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VerificheModule { }
