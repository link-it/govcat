import { MultiSnackbarComponent } from "./multi-snackbar/multi-snackbar.component";
import { YesnoDialogBsComponent } from "./yesno-dialog-bs/yesno-dialog-bs.component";

// Non-standalone dialogs (declared in ComponentsModule)
export const dialogs = [
    YesnoDialogBsComponent
];

// Standalone dialogs (imported in ComponentsModule)
export const standaloneDialogs = [
    MultiSnackbarComponent
];

export {
    YesnoDialogBsComponent,
    MultiSnackbarComponent
};