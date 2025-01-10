import { TestBed } from '@angular/core/testing';

import { ServiceBreadcrumbsResolver } from './service-breadcrumbs.resolver';

describe('ParentServiceResolver', () => {
  let resolver: ServiceBreadcrumbsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ServiceBreadcrumbsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
