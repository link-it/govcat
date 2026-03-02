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
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ServiceBreadcrumbsResolver } from './service-breadcrumbs.resolver';
import { ConfigService } from '@linkit/components';

describe('ParentServiceResolver', () => {
  let resolver: ServiceBreadcrumbsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { getConfiguration: () => ({ AppConfig: { GOVAPI: { HOST: '', HOST_PDND: '', HOST_MONITOR: '' } } }) } }
      ]
    });
    resolver = TestBed.inject(ServiceBreadcrumbsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
