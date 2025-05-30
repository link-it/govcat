import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { ErrorViewModule } from '@app/components/error-view/error-view.module';
import { SelectionDropdownModule } from '@app/components/selection-dropdown/selection-dropdown.module';

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
     ComponentsModule,
    ErrorViewModule,
    SelectionDropdownModule,
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
