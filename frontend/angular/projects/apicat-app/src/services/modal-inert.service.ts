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
 */
@Injectable({ providedIn: 'root' })
export class ModalInertService {

  private openCount = 0;
  private initialized = false;

  constructor(private readonly modalService: BsModalService) {}

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.modalService.onShow.subscribe(() => this.onModalOpen());
    this.modalService.onHidden.subscribe(() => this.onModalClose());
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
        el.setAttribute('aria-hidden', 'true');
      }
    }
  }

  private onModalClose(): void {
    this.openCount = Math.max(0, this.openCount - 1);
    if (this.openCount === 0) {
      const el = this.appRoot;
      if (el) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    }
  }
}
