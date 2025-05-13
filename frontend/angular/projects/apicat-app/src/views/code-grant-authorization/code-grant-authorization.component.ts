import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
    selector: 'code-grant-authorization',
    templateUrl: 'code-grant-authorization.component.html',
    styleUrls: ['code-grant-authorization.component.scss'],
    standalone: false

})
export class CodeGrantAuthorizationComponent implements OnInit {

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
        // http://localhost:6200/code-grant-authorization?return=ok&session_state=5c35aaa3-b918-46b6-919f-a3b7778773bb&code=08243a09-271e-4d52-9f03-243d00abb9c3.5c35aaa3-b918-46b6-919f-a3b7778773bb.a48ccdbe-10e7-46f3-98c7-76026e5e7987

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
