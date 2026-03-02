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
import { LnkCardComponent } from "@app/components/lnk-ui/card/card.component";
import { LnkButtonComponent } from "@app/components/lnk-ui/button/button.component";
import { LnkDropdwnButtonComponent } from '@app/components/lnk-ui/dropdown-button/dropdown-button.component';
import { LnkIconToggleComponent } from '@app/components/lnk-ui/icon-toggle/icon-toggle.component';
import { PopoverHelpComponent } from '@app/components/lnk-ui/popover-help/popover-help.component';
import { LnkFormFieldComponent } from "@app/components/lnk-ui/form-field/form-field.component";
import { LnkFormFieldsetComponent } from "@app/components/lnk-ui/form-fieldset/form-fieldset.component";
import { LnkFormSelectComponent } from "@app/components/lnk-ui/form-select/form-field-select.component";
import { LnkFormSubmitComponent } from "@app/components/lnk-ui/form-submit/submit.component";
import { LnkFormErrorComponent } from "@app/components/lnk-ui/form-error/form-error.component";
import { LnkFormFieldErrorComponent } from "@app/components/lnk-ui/form-field-error/form-field-error.component";
import { LnkFormLiveSearchComponent } from "@app/components/lnk-ui/form-live-search/form-live-search.component";
import { LnkFieldPlaintextComponent } from "@app/components/lnk-ui/field-plaintext/field-plaintext.component";

export const APP_COMPONENTS_IMPORTS = [
  LnkCardComponent,
  LnkButtonComponent,
  LnkDropdwnButtonComponent,
  LnkIconToggleComponent,
  PopoverHelpComponent,
  LnkFormFieldComponent,
  LnkFormFieldsetComponent,
  LnkFormSubmitComponent,
  LnkFormErrorComponent,
  LnkFormSelectComponent,
  LnkFormFieldErrorComponent,
  LnkFormLiveSearchComponent,
  LnkFieldPlaintextComponent
] as const;
