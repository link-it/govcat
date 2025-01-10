import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';

@Component({
  selector: 'app-about-mini-box',
  templateUrl: './about-mini-box.component.html',
  styleUrls: ['./about-mini-box.component.scss']
})
export class AboutMiniBoxComponent implements OnInit {

  _spin: boolean = true;

  config: any;
  appConfig: any;

  contentHtml: string = '';

  constructor(
    private translate: TranslateService,
    private configService: ConfigService
  ) { 
    this.appConfig = this.configService.getConfiguration();

    this.configService.getConfig('about').subscribe(
      (config: any) => {
        this.config = config;
      }
    );
  }

  ngOnInit() {
    this._loadPage();
  }

  _loadPage() {
    this._spin = true;
    this._loadStyle('./assets/about/css/styles.css', 'about-css');
    this._loadScript('./assets/about/js/scripts.js', 'about-script');

    this.configService.getPage('about-box', 'about').subscribe({
      next: (results: any) => {
        this.contentHtml = results;
        this._spin = false;
      },
      error: (error: any) => {
        console.log('_loadPage error', error);
        this._spin = false;
      }
    });
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
