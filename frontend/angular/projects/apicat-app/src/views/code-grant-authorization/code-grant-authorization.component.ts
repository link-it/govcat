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
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'code-grant-authorization',
    templateUrl: 'code-grant-authorization.component.html',
    styleUrls: ['code-grant-authorization.component.scss'],
    standalone: false
})
export class CodeGrantAuthorizationComponent implements OnInit, OnDestroy {

    logo = './assets/images/linkit_logo/linkit_logo_2x.png';

    data: any = null;

    spin: boolean = true;
    
    broadcastChannel = new BroadcastChannel('CODE-GRANT-AUTHORIZATION');
    
    debug: boolean = false;

    constructor(
        private route: ActivatedRoute
    ) {

    }

    ngOnInit() {
        this.route.queryParams.subscribe((val) => { 
            console.log('val', val);
            const _return = val['return'];
            const _session_state = val['session_state'];
            const _code = val['code'];
            this.data = { return: _return, session_state: _session_state, code: _code };

            setTimeout(() => {
                this.sendPostMessage();
            }, 1500);
        });
    }

    ngOnDestroy(): void {
        this.broadcastChannel.close();
    }

    sendPostMessage() {
        this.broadcastChannel.postMessage(this.data);
    }
}
