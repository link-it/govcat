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
import { AddEditValueComponent } from "./add-edit-value/add-edit-value.component";
import { AllegatoComponent } from "./allegato/allegato.component";
import { BoxCollapseComponent } from "./box-collapse/box-collapse.component";
import { BoxMessageComponent } from "./box-message/box-message.component";
import { BoxSpinnerComponent } from "./box-spinner/box-spinner.component";
import { BreadcrumbComponent } from "./breadcrumb/breadcrumb.component";
import { BreadcrumbService } from "./breadcrumb/breadcrumb.service";
// import { CardComponent } from "./card/card.component";
import { CollapseRowComponent } from "./collapse-row/collapse-row.component";
import { DataTypeComponent } from "./data-type/data-type.component";
import { DataCollapseComponent } from "./data-view/data-collapse.component";
import { DataViewComponent } from "./data-view/data-view.component";
import { FileUploadComponent } from "./file-upload/file-upload.component";
import { FileUploaderComponent } from "./file-uploader/file-uploader.component";
import { FormReadonlyComponent } from "./form-readonly/form-readonly.component";
import { InputHelpComponent } from "./input-help/input-help.component";
import { ItemRowComponent } from "./item-row/item-row.component";
import { ItemRowMobileComponent } from "./item-row-mobile/item-row-mobile.component";
import { ItemTypeComponent } from "./item-type/item-type.component";
import { PhotoBase64Component } from "./photo-base64/photo-base64.component";
import { PlaceholderLoadingComponent } from "./placeholder-loading/placeholder-loading.component";
import { ProgressComponent } from "./progress/progress.component";
import { RepeaterComponent } from "./repeater/repeater.component";
import { SearchBarFormComponent } from "./search-bar-form/search-bar-form.component";
import { TokenSegmentComponent } from "./search-bar-form/token-segment/token-segment.component";
import { SenderComponent } from "./sender/sender.component";

export const ui = [
    AddEditValueComponent,
    AllegatoComponent,
    BoxCollapseComponent,
    BoxMessageComponent,
    BoxSpinnerComponent,
    BreadcrumbComponent,
    // CardComponent,
    CollapseRowComponent,
    DataTypeComponent,
    DataCollapseComponent,
    DataViewComponent,
    FileUploadComponent,
    FileUploaderComponent,
    FormReadonlyComponent,
    InputHelpComponent,
    ItemRowComponent,
    ItemRowMobileComponent,
    ItemTypeComponent,
    PhotoBase64Component,
    PlaceholderLoadingComponent,
    ProgressComponent,
    RepeaterComponent,
    SearchBarFormComponent,
    TokenSegmentComponent,
    SenderComponent
];

export const uiServices = [
    BreadcrumbService
];

export {
    AddEditValueComponent,
    AllegatoComponent,
    BoxCollapseComponent,
    BoxMessageComponent,
    BoxSpinnerComponent,
    BreadcrumbComponent,
    // CardComponent,
    CollapseRowComponent,
    DataTypeComponent,
    DataCollapseComponent,
    DataViewComponent,
    FileUploadComponent,
    FileUploaderComponent,
    FormReadonlyComponent,
    InputHelpComponent,
    ItemRowComponent,
    ItemRowMobileComponent,
    ItemTypeComponent,
    PhotoBase64Component,
    PlaceholderLoadingComponent,
    ProgressComponent,
    RepeaterComponent,
    SearchBarFormComponent,
    TokenSegmentComponent,
    SenderComponent,

    BreadcrumbService
}
