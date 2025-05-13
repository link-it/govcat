import {AfterViewInit, Directive, ElementRef, HostBinding, HostListener, Inject, Input, OnInit, Renderer2} from '@angular/core';
import {DOCUMENT} from '@angular/common';

@Directive({
    selector: '[appSidebarMinimizer]',
    standalone:false

})
export class SidebarMinimizeDirective {
    constructor(
        @Inject(DOCUMENT) private document: any,
        private renderer: Renderer2,
    ) { }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        const body = this.document.body;
        body.classList.contains('sidebar-minimized') ?
            this.renderer.removeClass(body, 'sidebar-minimized') :
            this.renderer.addClass(body, 'sidebar-minimized');
    }
}

@Directive({
    selector: '[appMobileSidebarToggler]',
    standalone:false

})
export class MobileSidebarToggleDirective {
    constructor(
        @Inject(DOCUMENT) private document: any,
        private renderer: Renderer2,
    ) { }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        const body = this.document.body;
        body.classList.contains('sidebar-show') ?
            this.renderer.removeClass(body, 'sidebar-show') :
            this.renderer.addClass(body, 'sidebar-show');
    }
}

/**
 * Allows the off-canvas sidebar to be closed via click.
 */
@Directive({
    selector: '[appSidebarClose]',
    standalone:false

})
export class SidebarOffCanvasCloseDirective {
    constructor(
        @Inject(DOCUMENT) private document: any,
        private renderer: Renderer2,
    ) { }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();

        const body = this.document.body;
        if (body.classList.contains('sidebar-off-canvas')) {
            body.classList.contains('sidebar-show') ?
                this.renderer.removeClass(body, 'sidebar-show') :
                this.renderer.addClass(body, 'sidebar-show');
        }
    }
}

@Directive({
    selector: '[appBrandMinimizer]',
    standalone:false

})
export class BrandMinimizeDirective {
    constructor(
        @Inject(DOCUMENT) private document: any,
        private renderer: Renderer2,
    ) { }

    @HostListener('click', ['$event'])
    toggleOpen($event: any) {
        $event.preventDefault();
        const body = this.document.body;
        body.classList.contains('brand-minimized') ?
            this.renderer.removeClass(body, 'brand-minimized') :
            this.renderer.addClass(body, 'brand-minimized');
    }
}


@Directive({
    selector: '[appHtmlAttr]',
    standalone:false

})
export class HtmlAttributesDirective implements OnInit {
    @Input() appHtmlAttr!: { [key: string]: string; };

    constructor(
        private renderer: Renderer2,
        private el: ElementRef
    ) {}

    ngOnInit() {
        const attribs = this.appHtmlAttr;
        for (const attr in attribs) {
            if (attr === 'style' && typeof(attribs[attr]) === 'object' ) {
                this.setStyle(attribs[attr]);
            } else if (attr === 'class') {
                this.addClass(attribs[attr]);
            } else {
                this.setAttrib(attr, attribs[attr]);
            }
        }
    }

    private setStyle(styles: any) {
        for (const style in styles) {
            this.renderer.setStyle(this.el.nativeElement, style, styles[style] );
        }
    }

    private addClass(classes: any) {
        const classArray = (Array.isArray(classes) ? classes : classes.split(' '));
        classArray.filter((element: any) => element.length > 0).forEach((element: any) => {
            this.renderer.addClass(this.el.nativeElement, element );
        });
    }

    private setAttrib(key: string, value: string | null) {
        value !== null ?
            this.renderer.setAttribute(this.el.nativeElement, key, value ) :
            this.renderer.removeAttribute(this.el.nativeElement, key);
    }
}

@Directive({
    selector: '[appFlyOut]',
    standalone:false

})
export class FlyOutDirective implements AfterViewInit {
    protected _elementClass: string[] = [];

    dropMenu: any = null;
    dropMenuList: any = null;

    constructor(
        private renderer: Renderer2,
        private el: ElementRef
    ) {
    }

    @HostBinding('class')
    get elementClass(): string {
        return this._elementClass.join(' ');
    }
    set(val: string) {
        this._elementClass = val.split(' ');
    }

    @HostListener('mouseenter') onMouseEnter() {
        const _elem = this.el.nativeElement;
        const _isActive = _elem?.classList.contains('active') || false;
        const _collapsedDesktop = _elem?.classList.contains('js-collapsed-desktop') || false;
        const _expandedMobile = _elem?.classList.contains('js-expanded-mobile') || false;
        const _isMobile = _elem?.classList.contains('js-mobile') || false;
        const _hasForceMenuOpen = _elem?.classList.contains('force-menu-open') || false;
        const _hasSubItems = this.dropMenu?.classList.contains('has-sub-items') || false;
        if (
            (!_isActive || _collapsedDesktop || _expandedMobile) &&
            !_isMobile &&
            (!_hasForceMenuOpen || _collapsedDesktop || _expandedMobile)
        ) {
            this._elementClass.push('is-over');
            this._elementClass.push('is-showing-fly-out');
            if (this.dropMenuList) {
                const _translateX = _elem.clientWidth - 7;
                let _translateY = _elem.offsetTop;
                if ((!_isActive || _expandedMobile) && _hasSubItems) {
                    const _offset = (_collapsedDesktop || _expandedMobile) ? 32 : 0;
                    _translateY = _elem.offsetTop - _offset;
                }
                this.renderer.addClass(this.dropMenuList, 'fly-out-list');
                this.dropMenuList.setAttribute('style', `display: block; transform: translate3d(${_translateX}px, ${_translateY}px, 0px); position: fixed;`);
            }
        }
    }

    @HostListener('mouseleave') onMouseLeave() {
        this._elementClass = [];
        if (this.dropMenuList) {
            this.renderer.removeClass(this.dropMenuList, 'fly-out-list');
            this.dropMenuList.setAttribute('style', '');
        }
    }

    ngAfterViewInit() {
        this.dropMenu = this.el.nativeElement.querySelector('a');
        this.dropMenuList = this.el.nativeElement.querySelector('ul');
    }
}
