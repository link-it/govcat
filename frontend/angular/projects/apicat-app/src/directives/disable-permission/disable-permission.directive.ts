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
import { OnInit, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Grant } from '@app/model/grant';

import { AuthenticationService } from '@app/services/authentication.service';

@Directive({
  selector: '[disablePermission]',
  standalone: false

})
export class DisablePermissionDirective implements OnInit, OnChanges {

  @Input() disablePermission: string = '';
  @Input() field: string | null = null;
  @Input() isNew: boolean = false;
  @Input() module: string = '';
  @Input() submodule: string = '';
  @Input() state: string = '';
  @Input() grant: Grant | null = null;
  
  controlName!: string;
  _ngControl: NgControl;

  constructor(
    private ngControl: NgControl,
    private authenticationService: AuthenticationService,
  ) {
    this._ngControl = ngControl;
    this.controlName = this._ngControl ? this._ngControl.name as string : '';
  }

  ngOnInit() {
    // this.applyStrategy();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.field) {
      this.field = changes.field.currentValue;
      this.controlName = this.field || this.controlName;
    }
    this.applyStrategy();
  }

  private applyStrategy() {
    const _canEdit = this.authenticationService.canEditField(this.module, this.submodule, this.state, this.controlName, this.grant?.ruoli );
    const action = (_canEdit || this.isNew) ? 'enable' : 'disable';
    if (this._ngControl && this._ngControl.control) {
      this._ngControl.control[action]();
    }    
  }
}
