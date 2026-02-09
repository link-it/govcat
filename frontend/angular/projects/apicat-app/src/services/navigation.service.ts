import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Servizio per la gestione della navigazione con supporto per apertura in nuova scheda.
 *
 * Uso nei componenti:
 * ```typescript
 * constructor(private navigationService: NavigationService) {}
 *
 * _onEdit(event: any, param: any) {
 *   const route = [this.model, param.id];
 *   this.navigationService.navigateWithEvent(event?.event, route);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  constructor(private router: Router, private location: Location) {}

  /**
   * Determina se l'evento indica che si vuole aprire in una nuova scheda.
   * - Ctrl+Click (Windows/Linux)
   * - Cmd+Click (macOS)
   * - Middle-click (button === 1)
   */
  shouldOpenInNewTab(event: MouseEvent | undefined): boolean {
    if (!event) return false;
    return event.ctrlKey || event.metaKey || event.button === 1;
  }

  /**
   * Naviga verso la route specificata.
   * Se l'evento indica apertura in nuova scheda, apre in nuova scheda.
   * Altrimenti usa la navigazione standard del Router Angular.
   *
   * @param event MouseEvent opzionale dall'evento click
   * @param route Array di segmenti per la navigazione (es. ['servizi', 123])
   * @param queryParams Query params opzionali
   */
  navigateWithEvent(event: MouseEvent | undefined, route: any[], queryParams?: any): void {
    if (this.shouldOpenInNewTab(event)) {
      event?.preventDefault();
      event?.stopPropagation();
      this.openInNewTab(route, queryParams);
    } else {
      this.router.navigate(route, { queryParams });
    }
  }

  /**
   * Apre la route specificata in una nuova scheda.
   * Usa Location.prepareExternalUrl per includere il baseHref.
   */
  openInNewTab(route: any[], queryParams?: any): void {
    const urlTree = this.router.createUrlTree(route, { queryParams });
    const url = this.router.serializeUrl(urlTree);
    // prepareExternalUrl aggiunge il baseHref (es. /apicat-app/) all'URL
    const fullUrl = this.location.prepareExternalUrl(url);
    window.open(fullUrl, '_blank');
  }

  /**
   * Helper per estrarre l'evento da un payload emesso da itemClick/simpleClick.
   * I componenti UI ora emettono { data: ..., event: MouseEvent }
   */
  extractEvent(payload: any): MouseEvent | undefined {
    return payload?.event;
  }

  /**
   * Helper per estrarre i dati da un payload emesso da itemClick/simpleClick.
   * I componenti UI ora emettono { data: ..., event: MouseEvent }
   */
  extractData(payload: any): any {
    return payload?.data ?? payload;
  }
}
