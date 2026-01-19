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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from '@linkit/components';
import { ConfigService } from '@linkit/components';
import { OpenAPIService } from '@services/openAPI.service';
import { ConsoleToggleService } from '@services/console-toggle.service';

import { environment } from '../environments/environment.prod';
import { registerLocaleData } from '@angular/common';

import localeEnGb from '@angular/common/locales/en-GB';
import localeIt from '@angular/common/locales/it';
import localeFr from '@angular/common/locales/fr';

import { defineLocale, getSetGlobalLocale } from 'ngx-bootstrap/chronos';
import { enGbLocale as ngxEnGbLocale, itLocale as ngxItLocale, frLocale as ngxFrLocale } from 'ngx-bootstrap/locale';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';

declare const $: any;
import * as moment from 'moment';

enum AppLanguageCode {
  ITALIAN = 'it',
  ENGLISH_GREAT_BRITAIN = 'en-gb',
  FRENCH = 'fr'
}

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'apicat-app';

  @ViewChild('watermark', { read: ElementRef }) watermark!: ElementRef;

  Tools = Tools;

  _config: any = null;

  configurazione: any = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private apiService: OpenAPIService,
    private consoleToggleService: ConsoleToggleService,
    private bsLocaleService: BsLocaleService,
  ) {
    this.consoleToggleService.disableConsoleInProduction();
    this._config = this.configService.getConfiguration();
    Tools.Versione = `Ver. ${environment.version}`;

    /* Lang */
    // const defaultLanguage = this.translate.currentLang || this.translate.getBrowserLang() || AppLanguageCode.ITALIAN;
    const defaultLanguage = AppLanguageCode.ITALIAN;
    console.log('defaultLanguage', defaultLanguage);

    // momentjs
    moment.locale(defaultLanguage);

    // angular
    registerLocaleData(localeEnGb, AppLanguageCode.ENGLISH_GREAT_BRITAIN);
    registerLocaleData(localeIt, AppLanguageCode.ITALIAN);
    registerLocaleData(localeFr, AppLanguageCode.FRENCH);

    // ngx-translate
    this.translate.setDefaultLang(defaultLanguage);
    this.translate.use(defaultLanguage);

    // ngx-bootstrap
    defineLocale(AppLanguageCode.ENGLISH_GREAT_BRITAIN, ngxEnGbLocale);
    defineLocale(AppLanguageCode.ITALIAN, ngxItLocale);
    defineLocale(AppLanguageCode.FRENCH, ngxFrLocale);

    getSetGlobalLocale(defaultLanguage);

    // ngx-bootstrap/datepicker
    this.bsLocaleService.use(defaultLanguage); // not affecting submodules
  }

  ngOnInit(): void {
    console.log('APP Configurazione Remota', Tools.Configurazione);
  }

  ngAfterViewInit() {
  }

  ngAfterContentChecked() {
  }
}
