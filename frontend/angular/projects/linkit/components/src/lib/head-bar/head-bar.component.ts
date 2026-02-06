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
import { Component, OnInit, Input, HostBinding, Output, EventEmitter } from '@angular/core';
import { Tools } from '../services/tools.service';
import { Language } from '../classes/language';
import { MenuAction } from '../classes/menu-action';

@Component({
  selector: 'app-head-bar',
  templateUrl: './head-bar.component.html',
  styleUrls: ['./head-bar.component.scss'],
  standalone: false
})
export class HeadBarComponent implements OnInit {
  @HostBinding('class.content-block') get headContentClass(): boolean {
    return !!Tools.USER_LOGGED;
  }
  @Input() title: string = '';
  @Input() logo: string = '';

  @Input() anonymous: boolean = true;
  @Input() login: boolean = false;
  @Input() loginLabel: string = 'Login';
  @Input('username') _username: string = '';
  @Input() loggedIn: boolean = false;
  @Input('menu-action-list') _menuActions: MenuAction[] = [];
  @Input('menu-app-action-list') _menuAppActions: MenuAction[] = [];
  @Input('menu-shell-action') _menuShellActions: MenuAction = new MenuAction();

  @Input('show-language-menu') _showLanguageMenu: boolean = true;
  @Input('language-list') _translations: Language[] = [];
  @Input('current-language') _currentLanguage: string = '';

  @Input('show-notifications') _showNotifications: boolean = false;
  @Input('icon-notifications') _iconNotifications: string = '';
  @Input('iconbs-notifications') _iconbsNotifications: string = '';
  @Input('notifications-counter') _notificationsCounter: number = 0;

  @Output('on-change-language') _changeLang: EventEmitter<any> = new EventEmitter();
  @Output('on-menu-action') _menuAction: EventEmitter<any> = new EventEmitter();
  @Output('on-menu-app-action') _menuAppAction: EventEmitter<any> = new EventEmitter();

  _notificationMenu: MenuAction = new MenuAction({
    title: 'Notifications',
    icon: 'inbox',
    subTitle: '',
    action: 'notifications'
  });

  _loginMenu: MenuAction = new MenuAction({
    title: 'Login',
    icon: 'login',
    subTitle: '',
    action: 'login'
  });

  constructor() { }

  ngOnInit() {
  }

  __headBarClass() {
    return {
      "container-fluid": true,
      'px-2': false,
      'content-block-slim': !(Tools.USER_LOGGED )
    };
  }

  _changeLanguage(_language: Language) {
    if (this._showLanguageMenu) {
      this._currentLanguage = _language.alpha3Code;
      this._changeLang.emit({ language: _language });
    }
  }

  _onMenuAction(_menuAction: MenuAction) {
    this._menuAction.emit({ menu: _menuAction });
  }

  _onMenuAppAction(_menuAction: MenuAction) {
    if (_menuAction.enabled) {
      this._menuAppAction.emit({ menu: _menuAction });
    }
  }

  onAvatarError(event: any) {
    console.log('onImageError', event);
    event.target.src = './assets/images/avatar.png'
  }
}
