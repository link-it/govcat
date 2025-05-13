import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'lnk-field-plaintext',
    templateUrl: './field-plaintext.component.html',
    standalone: false,
    styleUrls: ['./field-plaintext.component.scss']
})
export class LnkFieldPlaintextComponent implements OnInit {

    @Input() label: string = '';
    @Input() value: any = '';
    @Input() inline: boolean = false;
    @Input() labelAlignRight: boolean = false;

    @Input() labelColumn: number = 4;
    @Input() valueColumn: number = 8;

    ngOnInit(): void {
    }
}
