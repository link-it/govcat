import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from 'projects/tools/src/lib/config.service';

import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit {

  title: string = 'APP.TITLE.About';
  messages: string[] = [];
  cancelText: string = 'Cencel';
  confirmText: string = 'APP.BUTTON.Close';
  confirmColor: string = 'confirm';
  version: string = '';
  build: string = '';
  backInfo: any = null;

  onClose: Subject<any> = new Subject();

  config: any;
  appConfig: any;

  _spin: boolean = true;
  desktop: boolean = false;

  contentHtml: string = '';

  constructor(
    private translate: TranslateService,
    private configService: ConfigService,
    private bsModalRef: BsModalRef,
  ) {
    this.appConfig = this.configService.getConfiguration();

    this.configService.getConfig('about').subscribe(
      (config: any) => {
        this.config = config;
      }
    );
  }

  ngOnInit() {
    this.onClose = new Subject();
    this._loadPage();
  }

  closeModal(confirm: boolean = false) {
    this.onClose.next(confirm);
    this.bsModalRef.hide();
  }

  _loadPage() {
    this._spin = true;
    this._loadStyle('./assets/about/css/styles.css', 'about-css');
    this._loadScript('./assets/about/js/scripts.js', 'about-script');

    const reqs: Observable<any>[] = [];
    reqs.push( this.configService.getPage('about', 'about').pipe( catchError((err) => { return of(''); })) );
    forkJoin(reqs).subscribe(
      (results: Array<any>) => {
        this.contentHtml = this._replacePlaceholder(results[0], { appVersion: this.version, appBuild: this.build, ...this.backInfo });
        this._spin = false;
      },
      (error: any) => {
        console.log('_loadPage forkJoin error', error);
        this._spin = false;
      }
    );
  }

  _replacePlaceholder(text: string, data: any) {
    let resultText = text;
    if (data) {
      // create variables from key object and repalce in html content with nested object
      for (const key in data) {
        // check if object has this key
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          if (typeof element === 'object') {
            resultText = this._replacePlaceholder(resultText, element);
          } else {
            resultText = resultText.replace(`{{${key}}}`, element);
          }
        }
      }
    }
    return resultText;
  }

  _loadStyle(styleName: string, styleId: string) {
    const head = document.getElementsByTagName('head')[0];

    let cssLink = document.getElementById(
      styleId
    ) as HTMLLinkElement;
    if (cssLink) {
      cssLink.href = styleName;
    } else {
      const style = document.createElement('link');
      style.id = styleId;
      style.rel = 'stylesheet';
      style.href = `${styleName}`;

      head.appendChild(style);
    }
  }

  _loadScript(scriptName: string, scriptId: string) {
    const head = document.getElementsByTagName('head')[0];

    let jsLink = document.getElementById(
      scriptId
    ) as HTMLLinkElement;
    if (jsLink) {
      jsLink.href = scriptName;
    } else {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = `${scriptName}`;

      head.appendChild(script);
    }
  }
}
