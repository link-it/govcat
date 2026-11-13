import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';

import { ModalInertService } from './modal-inert.service';

describe('ModalInertService', () => {
  let appRoot: HTMLElement;
  let onShow: EventEmitter<any>;
  let onHidden: EventEmitter<any>;
  let service: ModalInertService;

  beforeEach(() => {
    appRoot = document.createElement('app-root');
    document.body.appendChild(appRoot);
    onShow = new EventEmitter();
    onHidden = new EventEmitter();
    TestBed.configureTestingModule({
      providers: [{ provide: BsModalService, useValue: { onShow, onHidden } }]
    });
    service = TestBed.inject(ModalInertService);
    service.init();
  });

  afterEach(() => {
    appRoot.remove();
  });

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
});
