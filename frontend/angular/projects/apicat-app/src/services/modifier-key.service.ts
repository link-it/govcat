import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servizio per rilevare quando Ctrl (Windows/Linux) o Cmd (macOS) sono premuti.
 * Aggiunge/rimuove la classe 'modifier-key-pressed' al body per permettere
 * agli stili CSS di mostrare feedback visivo.
 */
@Injectable({
  providedIn: 'root'
})
export class ModifierKeyService implements OnDestroy {
  private readonly BODY_CLASS = 'modifier-key-pressed';
  private isListening = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.startListening();
    }
  }

  /**
   * Inizia ad ascoltare gli eventi keydown/keyup
   */
  startListening(): void {
    if (!this.isBrowser || this.isListening) return;

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    // Rimuove la classe quando la finestra perde il focus
    window.addEventListener('blur', this.onBlur);
    this.isListening = true;
  }

  /**
   * Smette di ascoltare gli eventi
   */
  stopListening(): void {
    if (!this.isBrowser || !this.isListening) return;

    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.removeClass();
    this.isListening = false;
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      this.addClass();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    // Rimuove quando né Ctrl né Meta sono premuti
    if (!event.ctrlKey && !event.metaKey) {
      this.removeClass();
    }
  };

  private onBlur = (): void => {
    // Rimuove la classe quando la finestra perde il focus
    this.removeClass();
  };

  private addClass(): void {
    document.body.classList.add(this.BODY_CLASS);
  }

  private removeClass(): void {
    document.body.classList.remove(this.BODY_CLASS);
  }
}
