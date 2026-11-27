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
import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';

/**
 * Rende inerte lo sfondo dell'applicazione mentre è aperta una modale ngx-bootstrap.
 * Le modali vengono spostate sotto <body> come fratelli di <app-root>; senza questo
 * servizio lo screen reader può ancora raggiungere il contenuto di sfondo (WCAG 4.1.2 / 2.4.3).
 * Gestisce le modali impilate tramite un contatore: lo sfondo torna interattivo solo
 * quando l'ultima modale è chiusa.
 * Basta l'attributo inert, che toglie lo sfondo anche dall'albero di accessibilità:
 * aria-hidden sarebbe ridondante e fa risultare vuote le label con testo visually-hidden.
 * Dà anche un nome accessibile alle modali che non ce l'hanno (ariaLabelledBy non passato
 * a show()): aria-labelledby punta al titolo della modale (WCAG 4.1.2).
 */
@Injectable({ providedIn: 'root' })
export class ModalInertService {

  private openCount = 0;
  private initialized = false;
  private titleSeq = 0;

  constructor(private readonly modalService: BsModalService) {}

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.modalService.onShow.subscribe(() => this.onModalOpen());
    this.modalService.onHidden.subscribe(() => this.onModalClose());
    // il titolo si valorizza al ciclo di change detection successivo all'apertura
    this.modalService.onShown.subscribe(() => setTimeout(() => this.nameDialogs()));
  }

  /** Collega ogni modale aperta senza nome al suo titolo. */
  nameDialogs(): void {
    document.querySelectorAll('modal-container[role="dialog"]').forEach((dialog: Element) => {
      if (dialog.hasAttribute('aria-labelledby') || dialog.hasAttribute('aria-label')) {
        return;
      }
      const title = dialog.querySelector('.modal-title, .modal-header h1, .modal-header h2, .modal-header h3, .modal-header h4, .modal-header h5, .modal-header h6');
      if (!title || !title.textContent?.trim()) {
        return;
      }
      if (!title.id) {
        title.id = `lnk-modal-title-${++this.titleSeq}`;
      }
      dialog.setAttribute('aria-labelledby', title.id);
    });
  }

  private get appRoot(): HTMLElement | null {
    return document.querySelector('app-root');
  }

  private onModalOpen(): void {
    this.openCount++;
    if (this.openCount === 1) {
      const el = this.appRoot;
      if (el) {
        el.setAttribute('inert', '');
      }
    }
  }

  private onModalClose(): void {
    this.openCount = Math.max(0, this.openCount - 1);
    if (this.openCount === 0) {
      const el = this.appRoot;
      if (el) {
        el.removeAttribute('inert');
      }
    }
  }
}
