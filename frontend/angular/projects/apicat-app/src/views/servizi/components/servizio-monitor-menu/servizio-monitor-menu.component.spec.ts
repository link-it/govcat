import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthenticationService } from '@app/services/authentication.service';
import { NavigationService } from '@app/services/navigation.service';
import { OpenAPIService } from '@app/services/openAPI.service';

import { ServizioMonitorMenuComponent } from './servizio-monitor-menu.component';

@Component({ selector: 'app-monitor-dropdown', standalone: true, template: '' })
class MonitorDropdownStubComponent {
  @Input() service_id: string | null = null;
  @Input() showComunications = false;
  @Input() showMonitoring = false;
  @Input() showManagement = false;
  @Input() currentAction: string | null = null;
  @Input() showVetrina = false;
  @Output() action = new EventEmitter<any>();
}

describe('ServizioMonitorMenuComponent', () => {
  let apiService: any;
  let authService: any;
  let navigationService: any;

  const servizio = { id_servizio: 's1', stato: 'pubblicato_produzione', package: false };

  const crea = (valore: any = servizio, pagina: string | null = 'transazioni') => {
    const fixture = TestBed.createComponent(ServizioMonitorMenuComponent);
    fixture.componentRef.setInput('servizio', valore);
    fixture.componentRef.setInput('paginaCorrente', pagina);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    apiService = {
      getDetails: vi.fn((nome: string, id: string, tipo: string) => of(tipo === 'referenti'
        ? { content: [{ utente: { id_utente: 'u1' } }] }
        : { ruoli: ['referente'] })),
      getList: vi.fn().mockReturnValue(of({ content: [] }))
    };
    authService = {
      getUser: vi.fn().mockReturnValue({ id_utente: 'u1' }),
      canManagementComunicazioni: vi.fn().mockReturnValue(true),
      canMonitoraggio: vi.fn((ruoli: string[]) => ruoli.includes('referente')),
      canManagement: vi.fn((m: string, s: string, stato: string, ruoli: string[]) => ruoli.includes('referente')),
      isGestore: vi.fn().mockReturnValue(false),
      _getConfigModule: vi.fn().mockReturnValue(null)
    };
    navigationService = { navigateWithEvent: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ServizioMonitorMenuComponent],
      providers: [
        { provide: OpenAPIService, useValue: apiService },
        { provide: AuthenticationService, useValue: authService },
        { provide: NavigationService, useValue: navigationService }
      ]
    });
    TestBed.overrideComponent(ServizioMonitorMenuComponent, {
      set: { imports: [MonitorDropdownStubComponent] }
    });
  });

  it('should enable communications, monitoring and management for a referent of the service', () => {
    const component = crea().componentInstance;
    expect(apiService.getDetails).toHaveBeenCalledWith('servizi', 's1', 'grant');
    expect(component.comunicazioni()).toBe(true);
    expect(component.monitoraggio()).toBe(true);
    expect(component.gestione()).toBe(true);
    expect(component.visibile()).toBe(true);
  });

  it('should hide monitoring and management to an API operator who is not a referent of the service', () => {
    authService.getUser.mockReturnValue({ id_utente: 'operatore' });
    authService.canManagementComunicazioni.mockReturnValue(false);
    const component = crea().componentInstance;
    expect(component.monitoraggio()).toBe(false);
    expect(component.gestione()).toBe(false);
    // resta la voce della vetrina
    expect(component.visibile()).toBe(true);
  });

  it('should allow the management of a package only to the gestore', () => {
    const component = crea({ ...servizio, package: true }).componentInstance;
    expect(component.gestione()).toBe(false);
    expect(authService.isGestore).toHaveBeenCalledWith(['referente']);
  });

  it('should stay hidden without a service or when the grant cannot be loaded', () => {
    expect(crea(null).componentInstance.visibile()).toBe(false);
    apiService.getDetails.mockReturnValue(throwError(() => ({ status: 403 })));
    expect(crea().componentInstance.visibile()).toBe(false);
  });

  it('should navigate to the management or to the page of the selected item', () => {
    const component = crea().componentInstance;
    component.onAction({ action: 'gestione' });
    expect(navigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 's1']);
    component.onAction({ action: 'statistiche' });
    expect(navigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 's1', 'statistiche']);
    component.onAction({});
    expect(navigationService.navigateWithEvent).toHaveBeenCalledTimes(2);
  });

  it('should navigate to the view of the service', () => {
    localStorage.removeItem('SERVIZI_VIEW');
    crea().componentInstance.onAction({ action: 'vetrina' });
    expect(navigationService.navigateWithEvent).toHaveBeenCalledWith(undefined, ['servizi', 's1', 'view']);
    expect(localStorage.getItem('SERVIZI_VIEW')).toBe('TRUE');
  });
});
