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
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { NavigationService } from '@app/services/navigation.service';

import { Taxonomy } from './taxonomy';

import * as _ from 'lodash';

@Component({
  selector: 'app-taxonomy-details',
  templateUrl: 'taxonomy-details.component.html',
  styleUrls: ['taxonomy-details.component.scss'],
  standalone: false
})
export class TaxonomyDetailsComponent implements OnInit, OnChanges, OnDestroy {
  static readonly Name = 'TaxonomyDetailsComponent';
  readonly model: string = 'tassonomie';

  @Input() id: number | null = null;
  @Input() taxonomy: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  _title: string = '';

  appConfig: any;

  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _editCurrent: any = null;
  _currentCategory: any = null;

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _taxonomy: Taxonomy = new Taxonomy({});

  _authorizations: any[] = [];

  _spin: boolean = true;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utils: UtilService,
    private navigationService: NavigationService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.id = params['id'];
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._loadAll();
          }
        );
      } else {
        this._isNew = true;
        this._isEdit = true;

        this._initBreadcrumb();

        this._initForm({ ...this._taxonomy });
        this._spin = false;
      }
    });
  }

  ngOnDestroy() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.taxonomy) {
      const taxonomy = changes.taxonomy.currentValue;
      this.taxonomy = taxonomy.source;
      this.id = this.taxonomy.id;
    }
  }

  _loadAll() {
    this._loadTaxonomy();
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'nome':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.required,
              Validators.maxLength(255)
            ]);
            break;
          case 'descrizione':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.required
            ]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);
    }
  }

  __onSave(body: any) {
    this._error = false;
    this._spin = true;
    
    const _body = this._prapareData(body);

    delete _body.id_tassonomia;

    this.apiService.saveElement(this.model, _body).subscribe(
      (response: any) => {
        this.taxonomy = new Taxonomy({ ...response });
        this._taxonomy = new Taxonomy({ ...response });
        this.id = this.taxonomy.id_tassonomia;
        this._initBreadcrumb();

        this._spin = false;
        this._isEdit = false;
        this._isNew = false;
        this.save.emit({ id: this.id, taxonomy: response, update: false });
        this.router.navigate([this.model, this.id], { replaceUrl: true });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    this._spin = true;

    const _body = this._prapareData(body);

    this.apiService.putElement(this.model, id, _body).subscribe(
      (response: any) => {
        this._isEdit = !this._closeEdit;
        this.taxonomy = new Taxonomy({ ...response });
        this._taxonomy = new Taxonomy({ ...response });
        this._spin = false;
        this.save.emit({ id: this.id, taxonomy: response, update: true });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    );
    
  }

  _prapareData(body: any) {
    const _newBody: any = {
      ...body,
      visibile: body.visibile || false,
      obbligatorio: body.obbligatorio || false
    };

    return _newBody;
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.taxonomy.id_tassonomia, form);
      }
    }
  }

  _changeVisible(event: any) {
    this.f['visibile'].patchValue(!this.f['visibile'].value);
    this.f['visibile'].updateValueAndValidity();
  }

  _changeMandatory(event: any) {
    this.f['obbligatorio'].patchValue(!this.f['obbligatorio'].value);
    this.f['obbligatorio'].updateValueAndValidity();
  }

  _confirmDelection() {
    this.utils._confirmDelection(null, this._deleteTaxonomy.bind(this));
  }

  _deleteTaxonomy() {
    this.apiService.deleteElement(this.model, this.taxonomy.id_tassonomia).subscribe(
      (response) => {
        this.router.navigate([this.model]);
      },
      (error) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
      }
    );
  }

  _loadTaxonomy() {
    if (this.id) {
      this.taxonomy = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.taxonomy = new Taxonomy({ ...response });
          this._taxonomy = new Taxonomy({ ...response });
          this._initBreadcrumb();

        this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.id ? `${this.taxonomy.nome}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Taxonomies', url: '/tassonomie', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _editTaxonomy() {
    this._error = false;
    this._isEdit = true;
    this._initForm({ ...this._taxonomy });
  }

  _onSave() {
    this.save.emit({ id: this.id, taxonomy: this._taxonomy });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      this.router.navigate([this.model]);
    } else {
      this._taxonomy = new Taxonomy({ ...this.taxonomy });
    }
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _onCategory(event?: MouseEvent) {
    const route = [this.model, this.id, 'categorie'];
    this.navigationService.navigateWithEvent(event, route);
  }
}
