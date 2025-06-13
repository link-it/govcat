import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[appUppercase]',
    standalone: false

})
export class UppercaseDirective {
    @Input('appUppercase') isEnabled: boolean = true;

    constructor(private el: ElementRef) {
    }

    @HostListener('input', ['$event']) onInputChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (this.isEnabled) {
            input.value = input.value.toUpperCase();
        }
    }
}
