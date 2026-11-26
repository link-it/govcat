import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';

import { ModalInertService } from './modal-inert.service';

describe('ModalInertService', () => {
  let appRoot: HTMLElement;
  let onShow: EventEmitter<any>;
  let onHidden: EventEmitter<any>;
  let onShown: EventEmitter<any>;
  let service: ModalInertService;

  beforeEach(() => {
    appRoot = document.createElement('app-root');
    document.body.appendChild(appRoot);
    onShow = new EventEmitter();
    onHidden = new EventEmitter();
    onShown = new EventEmitter();
    TestBed.configureTestingModule({
      providers: [{ provide: BsModalService, useValue: { onShow, onHidden, onShown } }]
    });
    service = TestBed.inject(ModalInertService);
    service.init();
  });

  afterEach(() => {
    vi.useRealTimers();
    appRoot.remove();
    document.querySelectorAll('modal-container').forEach(el => el.remove());
  });

  function addDialog(html: string): HTMLElement {
    const dialog = document.createElement('modal-container');
    dialog.setAttribute('role', 'dialog');
    dialog.innerHTML = html;
    document.body.appendChild(dialog);
    return dialog;
  }

  it('should make the background inert without aria-hidden while a modal is open', () => {
    onShow.emit();
    expect(appRoot.hasAttribute('inert')).toBe(true);
    expect(appRoot.hasAttribute('aria-hidden')).toBe(false);

    onHidden.emit();
    expect(appRoot.hasAttribute('inert')).toBe(false);
  });

  it('should restore the background only when the last stacked modal is closed', () => {
    onShow.emit();
    onShow.emit();
    onHidden.emit();
    expect(appRoot.hasAttribute('inert')).toBe(true);

    onHidden.emit();
    expect(appRoot.hasAttribute('inert')).toBe(false);
  });

  it('should label a shown modal with its title', () => {
    vi.useFakeTimers();
    const dialog = addDialog('<div class="modal-header"><h5 class="modal-title">Storico</h5></div>');
    onShown.emit();
    vi.runAllTimers();
    const id = dialog.getAttribute('aria-labelledby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toBe('Storico');
  });

  it('should keep the title id and give stacked modals their own title', () => {
    const first = addDialog('<h4 class="modal-title" id="primo">Gruppo</h4>');
    const second = addDialog('<div class="modal-header"><h4>Scegli il padre</h4></div>');
    vi.useFakeTimers();
    onShown.emit();
    vi.runAllTimers();
    expect(first.getAttribute('aria-labelledby')).toBe('primo');
    const id = second.getAttribute('aria-labelledby');
    expect(id).not.toBe('primo');
    expect(document.getElementById(id!)?.textContent).toBe('Scegli il padre');
  });

  it('should not override an existing name nor use an empty title', () => {
    const named = addDialog('<h5 class="modal-title">Titolo</h5>');
    named.setAttribute('aria-label', 'Nome dato');
    const empty = addDialog('<h5 class="modal-title"> </h5>');
    vi.useFakeTimers();
    onShown.emit();
    vi.runAllTimers();
    expect(named.hasAttribute('aria-labelledby')).toBe(false);
    expect(empty.hasAttribute('aria-labelledby')).toBe(false);
  });
});
