import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;
  let modalService: any;

  beforeEach(() => {
    modalService = {
      show: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        DialogService,
        { provide: BsModalService, useValue: modalService }
      ]
    });
    service = TestBed.inject(DialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set static instance on construction', () => {
    expect(DialogService.getInstance()).toBe(service);
  });

  it('should open dialog and return observable', () => {
    const onClose = new Subject<boolean>();
    const mockModalRef = { content: { onClose } } as unknown as BsModalRef;
    modalService.show.mockReturnValue(mockModalRef);

    class FakeComponent {}
    const result = service.openDialog({ class: 'modal-sm' }, FakeComponent as any);

    expect(modalService.show).toHaveBeenCalledWith(FakeComponent, { class: 'modal-sm' });
    expect(result).toBeDefined();

    let emitted = false;
    result.subscribe(val => {
      emitted = true;
      expect(val).toBe(true);
    });
    onClose.next(true);
    expect(emitted).toBe(true);
  });

  it('should pass data config to modal show', () => {
    const onClose = new Subject<boolean>();
    const mockModalRef = { content: { onClose } } as unknown as BsModalRef;
    modalService.show.mockReturnValue(mockModalRef);

    class AnotherComponent {}
    const config = { initialState: { title: 'Test' }, class: 'modal-lg' };
    service.openDialog(config, AnotherComponent as any);

    expect(modalService.show).toHaveBeenCalledWith(AnotherComponent, config);
  });
});
