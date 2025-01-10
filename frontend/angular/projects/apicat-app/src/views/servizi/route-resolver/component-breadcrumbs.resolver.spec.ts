import { TestBed } from '@angular/core/testing';

import { ComponentBreadcrumbsResolver } from './component-breadcrumbs.resolver';

describe('ParentComponentResolver', () => {
  let resolver: ComponentBreadcrumbsResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(ComponentBreadcrumbsResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
