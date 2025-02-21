import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';

import { HeadBarComponent } from './head-bar/head-bar.component';
import { MultiSnackbarComponent } from './dialogs/multi-snackbar/multi-snackbar.component';

// UI
import { YesnoDialogBsModule } from './dialogs/yesno-dialog-bs/yesno-dialog-bs.module';
import { BreadcrumbModule } from './ui/breadcrumb/breadcrumb.module';
import { BoxMessageModule } from './ui/box-message/box-message.module';
import { BoxSpinnerModule } from './ui/box-spinner/box-spinner.module';
import { FormReadonlyModule } from './ui/form-readonly/form-readonly.module';
import { DataTypeModule } from './ui/data-type/data-type.module';
import { DataViewModule } from './ui/data-view/data-view.module';
import { BoxCollapseModule } from './ui/box-collapse/box-collapse.module';
import { SearchBarFormModule } from './ui/search-bar-form/search-bar-form.module';
import { SearchGoogleFormModule } from './ui/search-google-form/search-google-form.module';
import { ItemTypeModule } from './ui/item-type/item-type.module';
import { ItemRowModule } from './ui/item-row/item-row.module';
import { CollapseRowModule } from './ui/collapse-row/collapse-row.module';
import { CardModule } from './ui/card/card.module';
import { InputHelpModule } from './ui/input-help/input-help.module';
import { AddEditValueModule } from './ui/add-edit-value/add-edit-value.module';
import { AppSwitcherModule } from './ui/app-switcher/app-switcher.module';
import { FileUploaderModule } from './ui/file-uploader/file-uploader.module';
import { PhotoBase64Module } from './ui/photo-base64/photo-base64.module';
import { SenderModule } from './ui/sender/sender.module';
import { AllegatoModule } from './ui/allegato/allegato.module';
import { RepeaterModule } from './ui/repeater/repeater.module';
import { PlaceholderLoadingModule } from './ui/placeholder-loading/placeholder-loading.module';

// Pipes
import { PluralTranslatePipe } from './pipes/plural-translate.pipe';
import { PropertyFilterPipe } from './pipes/service-filters';
import { OrderByPipe } from './pipes/ordeby.pipe';
import { HighlighterPipe } from './pipes/highlighter.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { MapperPipe } from './pipes/mapper.pipe';
import { PrettyjsonPipe } from './pipes/pretty-json.pipe';
import { HttpImgSrcPipeModule } from './pipes/http-img-src.module';

// Directives
import { HtmlAttributesModule } from './directives/html-attr.module';
import { ClickOutsideModule } from './directives/click-outside.module';
import { RouterLinkMatchModule } from './directives/router-link-match.module';
import { TextUppercaseModule } from './directives/uppercase.module';
import { TextLowercaseModule } from './directives/lowercase.module';
import { CountUpeModule } from './directives/count-up.module';
import { SetBackgroundImageModule } from './directives/set-background-image.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    VendorsModule,

    // UI
    YesnoDialogBsModule,
    BreadcrumbModule,
    BoxMessageModule,
    BoxSpinnerModule,
    FormReadonlyModule,
    DataTypeModule,
    DataViewModule,
    BoxCollapseModule,
    SearchBarFormModule,
    SearchGoogleFormModule,
    ItemTypeModule,
    ItemRowModule,
    CollapseRowModule,
    CardModule,
    InputHelpModule,
    AddEditValueModule,
    AppSwitcherModule,
    FileUploaderModule,
    PhotoBase64Module,
    SenderModule,
    AllegatoModule,
    RepeaterModule,
    PlaceholderLoadingModule,

    // Directives
    HtmlAttributesModule,
    ClickOutsideModule,
    RouterLinkMatchModule,
    TextUppercaseModule,
    TextLowercaseModule,
    CountUpeModule,
    SetBackgroundImageModule,

    // Pipes
    HttpImgSrcPipeModule
  ],
  declarations: [
    HeadBarComponent,
    MultiSnackbarComponent,

    // Pipes
    PluralTranslatePipe,
    PropertyFilterPipe,
    OrderByPipe,
    HighlighterPipe,
    SafeHtmlPipe,
    SafeUrlPipe,
    MapperPipe,
    PrettyjsonPipe
  ],
  exports: [
    // UI
    YesnoDialogBsModule,
    BreadcrumbModule,
    BoxMessageModule,
    BoxSpinnerModule,
    FormReadonlyModule,
    DataTypeModule,
    DataViewModule,
    BoxCollapseModule,
    SearchBarFormModule,
    SearchGoogleFormModule,
    ItemTypeModule,
    ItemRowModule,
    CollapseRowModule,
    CardModule,
    InputHelpModule,
    AddEditValueModule,
    AppSwitcherModule,
    FileUploaderModule,
    PhotoBase64Module,
    SenderModule,
    AllegatoModule,
    RepeaterModule,
    PlaceholderLoadingModule,

    HeadBarComponent,
    MultiSnackbarComponent,

    // Pipes
    PluralTranslatePipe,
    PropertyFilterPipe,
    OrderByPipe,
    HighlighterPipe,
    SafeHtmlPipe,
    SafeUrlPipe,
    MapperPipe,
    PrettyjsonPipe,

    // Directives
    HtmlAttributesModule,
    RouterLinkMatchModule,
    TextUppercaseModule,
    TextLowercaseModule,
    CountUpeModule,
    SetBackgroundImageModule,

    // Pipes
    HttpImgSrcPipeModule
  ]
})
export class ComponentsModule { }
