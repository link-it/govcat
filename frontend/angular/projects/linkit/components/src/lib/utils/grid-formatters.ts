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
import { formatCurrency } from '@angular/common';
import { Injectable } from '@angular/core';

import moment from 'moment/moment';

import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { UtilsLib } from './utils.lib';

registerLocaleData(localeIt);

@Injectable({
  providedIn: 'root'
})
export class GridFormatters {

  public static locale = 'it-IT';
  public static currency = '€';
  public static currencyCode = 'EUR';
  public static digitsInfo = '1.2-2';

  constructor(private utils: UtilsLib) { }

  public static formatNumber(number: number) {
    return Math.floor(number).toLocaleString();
  }

  public static numberFormatter(params: any, html: boolean = true) {
    const cssClass = '';
    const _number = this.formatNumber(params.value);
    if (html) {
      if (!!params.hideZero) {
        return '';
      } else {
        let _icon = '';
        if (params.icon) {
          _icon = `<em class="bi bi-${params.icon} ms-2 me-1"></em>`;
        }
        let _tooltip = '';
        if (params.tooltip) {
          _tooltip = `title="${params.tooltip}" data-bs-toggle="tooltip"`;
        }
        return `<div class="d-inline-block" ${_tooltip}>${_icon}<span class="${cssClass}">${_number}</span></div`;
      } 
    } else {
      return _number;
    }
  }

  public static currencyFormatter(params: any, html: boolean = true) {
    const cssClass = '';
    const currency = formatCurrency(params.value || 0, GridFormatters.locale, GridFormatters.currency, GridFormatters.currencyCode, GridFormatters.digitsInfo);
    if (html) {
      return '<span class="' + cssClass + '">' + currency + '</span>';
    } else {
      return currency;
    }
  }

  public static dateFormatter(params: any, html: boolean = true) {
    const cssClass = '';
    const format = params.format || 'DD-MM-YYYY';
    const date = params.value ? moment(params.value).format(format) : '';
    if (html) {
      return '<span class="' + cssClass + '">' + date + '</span>';
    } else {
      return date;
    }
  }

  public static checkBoxormatter(params: any) {
    let cssClass = 'badge-';
    let result = '';
    if (params.value) {
      cssClass += ' badge-success-';
      result = '√';
    } else {
      cssClass += ' badge-light-';
      result = '';
    }
    return '<span class="' + cssClass + '">' + result + '</span>';
  }

  public static onOffFormatter(params: any) {
    let cssClass = 'badge badge-pill-';
    let result = '';
    if (params.value) {
      cssClass += ' badge-success';
      result = 'ON';
    } else {
      cssClass += ' badge-danger';
      result = 'OFF';
    }
    return '<span class="' + cssClass + '">' + result + '</span>';
  }

  public static progressFormatter(params: any) {
    if (params.value) {
      return `<div class="progress rounded-0 border" style="height: 14px;margin-top: 0.35rem;"><div class="progress-bar" style="width: ${params.value}%;" aria-valuenow="${params.value}" aria-valuemin="0" aria-valuemax="100">${params.value}</div></div>`;
    } else {
      return `<div class="progress rounded-0 border" style="height: 14px;margin-top: 0.35rem;"><div class="progress-bar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>`;
    }
  }

  public static statusFormatter(params: any) {
    if (params.value) {
      const _value = params.options.status[params.value].label || params.value;
      const _label = (params.options && params.options.statusLabel) ? params.options.statusLabel : 'Status';
      const _background = (params.options && params.options.status && params.options.status[params.value]) ? params.options.status[params.value].background : '#1f1f1f';
      const _border = (params.options && params.options.status && params.options.status[params.value]) ? params.options.status[params.value].border : '#1f1f1f';
      const _color = (params.options && params.options.status && params.options.status[params.value]) ? params.options.status[params.value].color : '#fff';
      const _class = params.options.statusSmall ? 'status-label-sm' : '';
      return `<span class="status-label ${_class} status-label-scoped status-ml-2" style = "--label-background-color:${_background}; --label-inset-border:inset 0 0 0 1px ${_border};color: ${_color}"> <span class="status-link status-label-link"> <span class="status-label-text">${_label}</span> <span class="status-label-text-scoped">${_value}</span></span></span>`;
    } else {
      const _background = '#1f1f1f';
      const _border = '#1f1f1f';
      const _color = '#fff';
      const _class = params.options.statusSmall ? 'status-label-sm' : '';
      return `<span class="status-label ${_class} status-label-scoped status-ml-2" style = "--label-background-color: ${_background}; --label-inset-border:inset 0 0 0 1px ${_border};color: ${_color}""></span>`;
    }
  }

  public static typeLabelFormatter(params: any) {
    const _optionsName = params.optionsName;
    if (_optionsName && params.options[_optionsName]) {
      const _label = (params.options && params.options[_optionsName].label) ? params.options[_optionsName].label : _optionsName;
      const _value = params.value ? (params.options[_optionsName].values[params.value] ? params.options[_optionsName].values[params.value].label : params.value) : 'undefined';
      const _background = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].background : '#1f1f1f';
      const _border = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].border : '#1f1f1f';
      const _color = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].color : '#fff';
      const _class = params.options[_optionsName].small ? 'status-label-sm' : '';
      return `<span class="status-label ${_class} status-label-scoped status-ml-2" style="--label-background-color:${_background}; --label-inset-border:inset 0 0 0 1px ${_border};color: ${_color}"> <span class="status-link status-label-link"> <span class="status-label-text">${_label}</span> <span class="status-label-text-scoped">${_value}</span></span></span>`;
    } else {
      const _label = params.field;
      const _value = params.value || 'undefined';
      const _background = '#1f1f1f';
      const _border = '#1f1f1f';
      const _color = '#fff';
      const _class = 'status-label-sm';
      return `<span class="status-label ${_class} status-label-scoped status-ml-2" style="--label-background-color: ${_background}; --label-inset-border:inset 0 0 0 1px ${_border};color: ${_color}""><span class="status-link status-label-link"> <span class="status-label-text">${_label}</span> <span class="status-label-text-scoped">${_value}</span></span></span>`;
    }
  }

  public static typeTagFormatter(params: any) {
    const _optionsName = params.optionsName;
    if (_optionsName && params.options && params.options[_optionsName]) {
      const _value = params.value ? (params.options[_optionsName].values[params.value] ? params.options[_optionsName].values[params.value].label : params.value) : 'undefined';
      const _background = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].background : '#1f1f1f';
      const _border = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].border : '#1f1f1f';
      const _color = (params.options && params.options[_optionsName] && params.options[_optionsName].values[params.value]) ? params.options[_optionsName].values[params.value].color : '#fff';
      const _showBadged = (params.field.badged !== undefined) ? params.field.badged : true;
      if (_showBadged) {
        const _class = 'gl-badge badge badge-pill';
        return `<span class="${_class}" style="background-color:${_background};color: ${_color}">${_value}</span>`;
      } else {
        return `<span class="">${_value}</span>`;
      }
    } else {
      const _value = params.value || 'undefined';
      const _background = '#1f1f1f';
      const _border = '#1f1f1f';
      const _color = '#fff';
      const _showBadged = params.field.badged ? params.field.badged : true;
      if (_showBadged) {
        const _class = 'gl-badge badge badge-pill';
        return `<span class="${_class}" style="background-color: ${_background};color: ${_color}"">${_value}</span>`;
      } else {
        return `<span class="">${_value}</span>`;
      }
    }
  }
}
