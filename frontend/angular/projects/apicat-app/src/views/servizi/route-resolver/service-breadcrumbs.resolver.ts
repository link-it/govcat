import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { OpenAPIService } from '@app/services/openAPI.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Servizio } from '../servizio-details/servizio';

export interface ServiceBreadcrumbsData {service: Servizio, breadcrumbs: any[]};

@Injectable({
  providedIn: 'root'
})
export class ServiceBreadcrumbsResolver implements Resolve<{service: Servizio, breadcrumbs: any[]}> {
  constructor(private apiService: OpenAPIService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{service: Servizio, breadcrumbs: any[]}> {
    const serviceId = route.params['id'];
    
    return this.apiService.getDetails('servizi', serviceId).pipe(
      map((response: any) => {
        const service = new Servizio({ ...response });
        const title = service.nome + ' v. ' + service.versione;
        const breadcrumbs = [
          { label: '', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
          { label: 'APP.TITLE.Services', url: '/servizi', type: 'link' },
          { label: title, url: `/servizi/${service.id_servizio}/view/` , type: 'link' }
        ];

        return {service, breadcrumbs};
      })
    );
  }
}
