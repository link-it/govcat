import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { ComponentsModule } from '@linkit/components';
import { AppComponentsModule } from "@app/components/components.module";
import { TassonomiaTokenModule } from '@app/components/token/tassonomia-token.module';

import { ServiziComponent } from './servizi.component';
import { ServiziRoutingModule } from './servizi-routing.module';
import { ServizioDetailsModule } from './servizio-details/servizio-details.module';
import { ServizioViewModule } from './servizio-view/servizio-view.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        MarkdownModule,
        ComponentsModule,
        AppComponentsModule,
        TassonomiaTokenModule,
        ServiziRoutingModule,
        ServizioDetailsModule,
        ServizioViewModule
    ],
    declarations: [
        ServiziComponent
    ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServiziModule { }
