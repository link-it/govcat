import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  selector: '[appOpenInNewTab]',
  standalone: false
})
export class OpenInNewTabDirective implements OnInit, OnDestroy {
  @Input() appOpenInNewTab: any[] = [];
  @Input() queryParams?: any;
  @Input() fragment?: string;
  @Input() openInNewTabAlways = false; // Sempre in nuovo tab
  @Input() preventNormalNavigation = false; // Blocca navigazione normale
  @Input() showIcon = true; // Mostra icona cliccabile

  private iconElement: HTMLElement | null = null;
  private iconClickListener: (() => void) | null = null;

  constructor(
    private router: Router,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if (this.showIcon) {
      this.createIcon();
    }
  }

  ngOnDestroy(): void {
    this.removeIcon();
  }

  private createIcon(): void {
    // Crea l'elemento icona
    this.iconElement = this.renderer.createElement('span');

    // Aggiungi le classi per lo stile
    this.renderer.addClass(this.iconElement, 'open-new-tab-icon');
    this.renderer.addClass(this.iconElement, 'bi');
    this.renderer.addClass(this.iconElement, 'bi-box-arrow-up-right');

    // Attributi per accessibilità
    this.renderer.setAttribute(this.iconElement, 'role', 'button');
    this.renderer.setAttribute(this.iconElement, 'aria-label', 'Apri in nuova scheda');
    this.renderer.setAttribute(this.iconElement, 'title', 'Apri in nuova scheda');

    // Aggiungi click handler all'icona (apre sempre in nuova scheda)
    this.iconClickListener = this.renderer.listen(this.iconElement, 'click', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.openInNewTab();
    });

    // Inserisci l'icona come ultimo figlio dell'elemento host
    this.renderer.appendChild(this.el.nativeElement, this.iconElement);
  }

  private removeIcon(): void {
    if (this.iconClickListener) {
      this.iconClickListener();
      this.iconClickListener = null;
    }
    if (this.iconElement && this.iconElement.parentNode) {
      this.renderer.removeChild(this.el.nativeElement, this.iconElement);
      this.iconElement = null;
    }
  }

  private openInNewTab(): void {
    const urlTree = this.router.createUrlTree(
      this.appOpenInNewTab,
      { queryParams: this.queryParams, fragment: this.fragment }
    );
    window.open(this.router.serializeUrl(urlTree), '_blank');
  }

  @HostListener('click', ['$event'])
  @HostListener('auxclick', ['$event'])
  onClick(event: MouseEvent): void {
    // Ignora se il click è sull'icona (gestito separatamente)
    if (this.iconElement && (event.target === this.iconElement || this.iconElement.contains(event.target as Node))) {
      return;
    }

    const shouldOpenInNewTab =
      this.openInNewTabAlways ||
      event.ctrlKey ||
      event.metaKey ||
      event.button === 1;

    if (shouldOpenInNewTab) {
      event.preventDefault();
      event.stopPropagation();
      this.openInNewTab();
    } else if (this.preventNormalNavigation) {
      event.preventDefault();
    }
  }
}
