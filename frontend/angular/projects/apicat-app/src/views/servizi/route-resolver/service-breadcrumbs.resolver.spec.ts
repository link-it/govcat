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
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';

import { ServiceBreadcrumbsResolver, ServiceBreadcrumbsData } from './service-breadcrumbs.resolver';
import { Servizio } from '../servizio-details/servizio';

describe('ServiceBreadcrumbsResolver', () => {
  let resolver: ServiceBreadcrumbsResolver;
  let mockApiService: any;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  const baseResponse = {
    id_servizio: 'srv-456',
    nome: 'TestService',
    versione: '1',
    stato: 'pubblicato',
    descrizione: 'A test service'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockApiService = { getDetails: vi.fn().mockImplementation(() => of(baseResponse)) };

    resolver = new ServiceBreadcrumbsResolver(mockApiService as any);

    mockRoute = { params: { id: 'srv-456' } } as any;
    mockState = {} as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  it('should call apiService.getDetails with correct arguments', async () => {
    await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'srv-456');
  });

  it('should return an Observable with service and breadcrumbs', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result).toHaveProperty('service');
    expect(result).toHaveProperty('breadcrumbs');
  });

  it('should return a Servizio instance in the service field', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.service).toBeInstanceOf(Servizio);
  });

  it('should populate the Servizio with response data', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.service.id_servizio).toBe('srv-456');
    expect(result.service.nome).toBe('TestService');
    expect(result.service.versione).toBe('1');
    expect(result.service.stato).toBe('pubblicato');
  });

  it('should return exactly 2 breadcrumb entries', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.breadcrumbs).toHaveLength(2);
  });

  it('should have the first breadcrumb as Services link with icon', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    const first = result.breadcrumbs[0];
    expect(first.label).toBe('APP.TITLE.Services');
    expect(first.url).toBe('/servizi');
    expect(first.type).toBe('link');
    expect(first.iconBs).toBe('grid-3x3-gap');
  });

  it('should have the second breadcrumb with service title "nome v. versione"', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    const second = result.breadcrumbs[1];
    expect(second.label).toBe('TestService v. 1');
    expect(second.type).toBe('link');
  });

  it('should have the second breadcrumb url ending with /view/', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    const second = result.breadcrumbs[1];
    expect(second.url).toBe('/servizi/srv-456/view/');
  });

  it('should NOT have a tooltip on the second breadcrumb (no TranslateService)', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    const second = result.breadcrumbs[1];
    expect(second.tooltip).toBeUndefined();
  });

  it('should use the correct route param id', async () => {
    const customRoute = { params: { id: 'custom-id-777' } } as any;
    mockApiService.getDetails.mockImplementation(() => of({ ...baseResponse, id_servizio: 'custom-id-777' }));

    await firstValueFrom(resolver.resolve(customRoute, mockState));
    expect(mockApiService.getDetails).toHaveBeenCalledWith('servizi', 'custom-id-777');
  });

  it('should handle a service with null nome and versione', async () => {
    const minimalResponse = { id_servizio: 'srv-min', stato: 'bozza' };
    mockApiService.getDetails.mockImplementation(() => of(minimalResponse));

    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.service.nome).toBeNull();
    expect(result.service.versione).toBeNull();
    expect(result.breadcrumbs[1].label).toBe('null v. null');
  });

  it('should correctly build breadcrumbs for a versioned service', async () => {
    const v2Response = { ...baseResponse, nome: 'PaymentAPI', versione: '2.1.0', id_servizio: 'pay-api' };
    mockApiService.getDetails.mockImplementation(() => of(v2Response));

    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.breadcrumbs[1].label).toBe('PaymentAPI v. 2.1.0');
    expect(result.breadcrumbs[1].url).toBe('/servizi/pay-api/view/');
  });

  it('should not have tooltip on the first breadcrumb', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.breadcrumbs[0].tooltip).toBeUndefined();
  });

  it('should not have iconBs on the second breadcrumb', async () => {
    const result = await firstValueFrom(resolver.resolve(mockRoute, mockState));
    expect(result.breadcrumbs[1].iconBs).toBeUndefined();
  });
});
