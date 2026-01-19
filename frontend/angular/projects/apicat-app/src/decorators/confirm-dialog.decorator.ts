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
import { YesnoDialogBsComponent } from '@linkit/components';
import { DialogService } from "./services/dialog.service";

const initialState = {
  title: 'APP.TITLE.Attention',
  messages: [
    'APP.MESSAGE.AreYouSure'
  ],
  cancelText: 'APP.BUTTON.Cancel',
  confirmText: 'APP.BUTTON.Confirm',
  confirmColor: 'danger'
};

export function needConfirmation (confirmData: any = initialState) {

  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any) {
      DialogService.getInstance()?.openDialog(confirmData, YesnoDialogBsComponent).subscribe((validation) => {
        if (validation) {
          originalMethod.apply(this, args);
        }
      });
    };

    return descriptor;
  };
}
