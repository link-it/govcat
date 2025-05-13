import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

@Component({
  selector: 'app-categories',
  templateUrl: 'categories.component.html',
  styleUrls: ['categories.component.scss'],
  standalone: false

})
export class CategoriesComponent implements OnInit, OnChanges {
  static readonly Name = 'CategoriesComponent';
  readonly model: string = 'categorie';

  @Input() id: number = 0;
  @Input() taxonomy: any;
  @Input() isEditable: boolean = true;
  @Input() selectable: boolean = false;
  @Input() notSelectable: any[] = [];
  @Input() selected: any[] = [];

  @Output() open: EventEmitter<any> = new EventEmitter<any>();
  @Output() action: EventEmitter<any> = new EventEmitter<any>();

  config: any;
  categoriesConfig: any;
  
  categories: any[] = [];

  _spin: boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;
  _errorMsg: string = '';

  apiUrl: string = '';

  constructor(
    public translateService: TranslateService,
    public eventsManagerService: EventsManagerService,
    private configService: ConfigService,
    public apiService: OpenAPIService,
    public utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();
    this.apiUrl = this.config.AppConfig.GOVAPI.HOST;
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.categoriesConfig = config;
        // this._loadTaxonomyCategories();
      }
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.id) {
      this._loadTaxonomyCategories();
    }
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  _loadTaxonomyCategories(query: any = null, url: string = '') {
    this._setErrorMessages(false);

    this._spin = true;
    this.apiService.getDetails('tassonomie', this.id, this.model).subscribe({
      next: (response: any) => {
        if (response.content) {
          let data: any[] = response.content;
          const _list: any = data.map((categoria: any) => {
            const element = {
              id: categoria.id_categoria,
              id_categoria: categoria.id_categoria,
              id_tassonomia: categoria.tassonomia.id_tassonomia,
              nome: categoria.nome,
              descrizione: categoria.descrizione || '',
              children: categoria.figli,
              figli: categoria.figli || null,
              hasChildren: !!categoria.figli,
              source: { ...categoria },
            };
            return element;
          });
          this.categories = (url) ? [...this.categories, ..._list] : [..._list];
        }
        this._spin = false;
      },
      error: (error: any) => {
        this._spin = false;
        this._setErrorMessages(true);
      }
    });
  }

  onOpen(event: any) {
    this.open.emit(event);
  }

  onAction(event: any) {
    this.action.emit(event);
  }

  __resetError() {
    this._error = false;
    this._errorMsg = '';
  }
}
