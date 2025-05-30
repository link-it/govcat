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
