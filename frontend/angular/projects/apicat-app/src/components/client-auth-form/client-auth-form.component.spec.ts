import { describe, it, expect, vi } from 'vitest';
import { FormControl, FormGroup } from '@angular/forms';
import { ClientAuthFormComponent } from './client-auth-form.component';
import { SelectedClientEnum } from '@app/views/adesioni/adesione-configurazioni/adesione-configurazioni.component';

describe('ClientAuthFormComponent', () => {

  function build(clientsRiuso: any[], credenziali: any = null): ClientAuthFormComponent {
    const component = new ClientAuthFormComponent();
    component.input = {
      formGroup: new FormGroup({ credenziali: new FormControl(credenziali) }),
      clientsRiuso
    } as any;
    return component;
  }

  describe('managedClients', () => {
    it('should exclude the toggle meta-items', () => {
      const component = build([
        { id_client: SelectedClientEnum.NuovoCliente, nome: 'Nuovo' },
        { id_client: SelectedClientEnum.UsaClientEsistente, nome: 'Esistente' },
        { id_client: 'c1', nome: 'Client 1' }
      ]);
      expect(component.managedClients.map(c => c.id_client)).toEqual(['c1']);
    });

    it('should keep the same reference while the content does not change', () => {
      const clients = [{ id_client: 'c1', nome: 'Client 1' }];
      const component = build(clients);
      const first = component.managedClients;
      expect(component.managedClients).toBe(first);

      clients.push({ id_client: 'c2', nome: 'Client 2' });
      const second = component.managedClients;
      expect(second).not.toBe(first);
      expect(second.map(c => c.id_client)).toEqual(['c1', 'c2']);
    });
  });

  describe('authTypeItems', () => {
    it('should return a stable empty list when no auth types are given', () => {
      const component = build([]);
      expect(component.authTypeItems).toEqual([]);
      expect(component.authTypeItems).toBe(component.authTypeItems);
    });
  });

  describe('credenzialiClientId', () => {
    it('should show the sentinel value as no selection', () => {
      const component = build([{ id_client: 'c1', nome: 'Client 1' }], SelectedClientEnum.UsaClientEsistente);
      expect(component.credenzialiClientId).toBeNull();
    });

    it('should return the selected client id', () => {
      const component = build([{ id_client: 'c1', nome: 'Client 1' }], 'c1');
      expect(component.credenzialiClientId).toBe('c1');
    });

    it('should update the control and emit changeCredenziali on selection', () => {
      const component = build([{ id_client: 'c1', nome: 'Client 1' }], SelectedClientEnum.UsaClientEsistente);
      const spy = vi.fn();
      component.changeCredenziali.subscribe(spy);

      component.credenzialiClientId = 'c1';

      expect(component.f['credenziali'].value).toBe('c1');
      expect(component.f['credenziali'].dirty).toBe(true);
      expect(spy).toHaveBeenCalledWith('c1');
    });
  });
});
