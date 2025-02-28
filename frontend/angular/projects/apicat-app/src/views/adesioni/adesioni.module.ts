import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { AdesioniComponent } from './adesioni.component';
import { AdesioniRoutingModule } from './adesioni-routing.module';
import { AdesioneDetailsModule } from './adesione-details/adesione-details.module';
import { AdesioneViewModule } from './adesione-view/adesione-view.module';
import { AdesioneConfigurazioneWizardModule } from './adesione-configurazione-wizard/adesione-configurazione-wizard.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    AdesioniRoutingModule,
    AdesioneDetailsModule,
    AdesioneViewModule,
    AdesioneConfigurazioneWizardModule
  ],
  declarations: [
    AdesioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioniModule { }
