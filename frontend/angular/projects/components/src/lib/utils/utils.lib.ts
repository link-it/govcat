import { Injectable } from '@angular/core';
import { formatCurrency } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import * as moment from 'moment';

interface RGB {
  b: number;
  g: number;
  r: number;
}

@Injectable({
  providedIn: 'root'
})
export class UtilsLib {

  locale = 'it-IT';
  currency = '€';
  currencyCode = 'EUR';
  digitsInfo = '1.2-2';

  constructor(
    private sanitized: DomSanitizer
  ) { }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  formatNumber = (value: number) => {
    return Math.floor(value)
      .toString()
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  };

  formatNumberSuff(value: any, args?: any): any {
    var exp, rounded,
      suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];
    if (Number.isNaN(value)) {
      return null;
    }
    if (value < 1000) {
      return value;
    }
    exp = Math.floor(Math.log(value) / Math.log(1000));
    return (value / Math.pow(1000, exp)).toFixed(args) + suffixes[exp - 1];
  }

  formatBytes(value: any) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];

    for (var i = 0; value >= 1024 && i < 4; i++) {
      value /= 1024;
    }

    return value.toFixed(2) + units[i];
  }

  getObjectValue(obj: any, path: string): any {
    if (!path) { return obj; }
    const properties: string[] = path.split('.');
    const first = properties.shift() || '';
    const _objFirst = (typeof obj[first] === 'boolean') ? obj[first].toString() : obj[first];
    return _objFirst ? this.getObjectValue(obj[first], properties.join('.')) : '';
  }

  currencyFormatter(value: any) {
    const currency = formatCurrency(value || 0, this.locale, this.currency, this.currencyCode, this.digitsInfo);
    return currency;
  }

  dateFormatter(value: any, config: any) {
    const format = (typeof config === 'object' ? config.format : config) || 'DD-MM-YYYY';
    const date = value ? moment(value).format(format) : '';
    return date;
  }

  msToTime(ms: number) {
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let time = '';
    if (days > 0) {
      time += days + " d ";
      ms -= days * (1000 * 60 * 60 * 24);
    }
    if (hours > 0) {
      time += hours + " h ";
      ms -= hours * (1000 * 60 * 60);
    }
    if (minutes > 0) {
      time += minutes + " m ";
      ms -= minutes * (1000 * 60);
    }
    if (seconds > 0) {
      time += seconds + " s ";
      ms -= seconds * 1000;
    }
    return time += ms + " ms";
  }

  removeEmptyFromObj(obj: any) {
    const $this = this;
    return Object.keys(obj)
      .filter(function (k) {
        return obj[k] != null;
      })
      .reduce(function (acc: any, k: string) {
        acc[k] = typeof obj[k] === "object" ? $this.removeEmptyFromObj(obj[k]) : obj[k];
        return acc;
      }, {});
  }

  // Random utilities

  _getRandomDifferent(arr: any[], last: string | undefined = undefined) {
    if (arr.length === 0) {
      return null;
    } else if (arr.length === 1) {
      return arr[0];
    } else {
      let num = 0;
      do {
        num = Math.floor(Math.random() * arr.length);
      } while (arr[num] === last);
      return arr[num];
    }
  }
  
  _getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  
  hashToIndex(hash: number, arrayLength: number): number {
    return Math.abs(hash) % arrayLength;
  }
  
  stringToColorIndex(str: string, colors: string[]): string {
    const hash = this.hashString(str);
    const index = this.hashToIndex(hash, colors.length);
    return colors[index];
  }
  
  // Colors utilities

  rgbToYIQ({ r, g, b }: RGB): number {
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
  }

  hexToRgb(hex: string): RGB | undefined {
    if (!hex || hex === undefined || hex === '') {
      return undefined;
    }

    const result: RegExpExecArray | null =
      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : undefined;
  }

  contrast(colorHex: string | undefined, threshold: number = 128): string {
    if (colorHex === undefined) {
      return '#000000';
    }

    const rgb: RGB | undefined = this.hexToRgb(colorHex);

    if (rgb === undefined) {
      return '#000000';
    }

    return this.rgbToYIQ(rgb) >= threshold ? '#000000' : '#ffffff';
  }
}
