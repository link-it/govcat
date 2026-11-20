import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '@services/authentication.service';
import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@services/utils.service';
import { RuoloOrganizzazioneEnum } from '../../../../model/ruoloOrganizzazioneEnum';
import { OrganizzazioneUtentiListComponent } from './organizzazione-utenti-list.component';

describe('OrganizzazioneUtentiListComponent', () => {
  let component: OrganizzazioneUtentiListComponent;
  let apiService: any;
  let modalService: any;
  let utils: any;
  const erroreReferente = { error: { detail: 'ORG.409.UTENTE.REFERENTE', errori: [{ params: { servizi: 'S1' } }] } };

  beforeEach(() => {
    apiService = {
      putElementRelated: vi.fn(),
      deleteElementRelated: vi.fn(),
      getList: vi.fn().mockReturnValue(of({ content: [] }))
    };
    modalService = { show: vi.fn() };
    utils = { GetErrorMsg: vi.fn().mockReturnValue('errore') };
    TestBed.configureTestingModule({
      providers: [
        { provide: OpenAPIService, useValue: apiService },
        { provide: AuthenticationService, useValue: {} },
        { provide: BsModalService, useValue: modalService },
        { provide: TranslateService, useValue: { instant: (k: string) => k } },
        { provide: UtilService, useValue: utils }
      ]
    });
    component = TestBed.runInInjectionContext(() => new OrganizzazioneUtentiListComponent());
    component.idOrganizzazione = 'org1';
    vi.spyOn(component, 'reload').mockImplementation(() => {});
  });

  const conferma = (risposta: boolean) => modalService.show.mockReturnValue({ content: { onClose: of(risposta) } });

  describe('utente referente che perde il ruolo', () => {
    it('should repeat the role change with force after the confirmation', () => {
      apiService.putElementRelated
        .mockReturnValueOnce(throwError(() => erroreReferente))
        .mockReturnValueOnce(of({}));
      conferma(true);
      (component as any)._update('u1', null);
      expect(modalService.show).toHaveBeenCalledTimes(1);
      expect(apiService.putElementRelated).toHaveBeenCalledTimes(2);
      expect(apiService.putElementRelated.mock.calls[0][4]).toBeUndefined();
      expect(apiService.putElementRelated.mock.calls[1]).toEqual(['organizzazioni', 'org1', 'utenti/u1', { ruolo_organizzazione: null }, { params: { force: 'true' } }]);
      expect(component.reload).toHaveBeenCalled();
    });

    it('should leave the role unchanged when the confirmation is cancelled', () => {
      apiService.putElementRelated.mockReturnValueOnce(throwError(() => erroreReferente));
      conferma(false);
      (component as any)._update('u1', RuoloOrganizzazioneEnum.OperatoreApi);
      expect(apiService.putElementRelated).toHaveBeenCalledTimes(1);
      expect(component.reload).not.toHaveBeenCalled();
      expect(component.error).toBe('');
    });

    it('should repeat the removal with force after the confirmation', () => {
      apiService.deleteElementRelated
        .mockReturnValueOnce(throwError(() => erroreReferente))
        .mockReturnValueOnce(of({}));
      conferma(true);
      (component as any)._remove('u1');
      expect(apiService.deleteElementRelated.mock.calls[1]).toEqual(['organizzazioni', 'org1', 'utenti/u1', { params: { force: 'true' } }]);
    });

    it('should show the other errors without asking', () => {
      apiService.deleteElementRelated.mockReturnValueOnce(throwError(() => ({ error: { detail: 'ORG.404' } })));
      (component as any)._remove('u1');
      expect(modalService.show).not.toHaveBeenCalled();
      expect(component.error).toBe('errore');
    });
  });
});
