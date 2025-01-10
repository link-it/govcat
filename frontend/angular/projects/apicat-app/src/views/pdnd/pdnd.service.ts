import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OpenAPIService } from '@app/services/openAPI.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ClientResponse {
    id: string;
    consumerId: string;
}

export interface OrganizationResponse {
    id: string;
    externalId: {
        origin: string;
        id: string;
    };
    name: string;
    category: string;
}

interface AttributeResponse {
    id: string;
    name: string;
    kind: string;
}

export interface EserviceAttribute {
    id: string;
    code: string;
    origin: string;
    explicitAttributeVerification: boolean;
}

export interface GroupOrSingleAttribute {
    group?: EserviceAttribute[],
    single?: EserviceAttribute[]
}

interface EserviceProducer {
    id: string;
    externalId: {
        origin: string;
        id: string;
    };
    name: string;
    category: string;
}

export interface EserviceResponse {
    id: string;
    producer: EserviceProducer;
    name: string;
    version: string;
    description: string;
    technology: string;
    attributes: {
        certified?: GroupOrSingleAttribute[];
        declared?: GroupOrSingleAttribute[];
        verified?: GroupOrSingleAttribute[];
    };
    state: string;
    serverUrls: string[];
}

export interface EserviceDescriptor {
    id: string;
    version: string;
    description: string;
    audience: string[];
    voucherLifespan: number;
    dailyCallsPerConsumer: number;
    dailyCallsTotal: number;
    docs: [
        {
            id: string;
            name: string;
            contentType: string;
        }
    ];
    state: string;
    serverUrls: string[];
    interface: {
        id: string;
        name: string;
        contentType: string;
    };
}

interface EserviceDescriptorsResponse {
    descriptors: EserviceDescriptor[];
}

interface Agreement {
    id: string;
    eserviceId: string;
    descriptorId: string;
    producerId: string;
    consumerId: string;
    state: string;
}

export interface Attribute { id: string, validity: string }

interface AgreementAttributesResponse {
    verified: Attribute[];
    certified: Attribute[];
    declared: Attribute[];
}

interface Purpose {
    id: string;
    throughput: number;
    state: string;
}

interface AgreementPurposesResponse {
    purposes: Purpose[];
}

interface EventsResponse {
    lastEventId: number;
    events: [
        {
            eventId: number;
            eventType: string;
            objectType: string;
            objectId: {
                additionalProp1: string;
                additionalProp2: string;
                additionalProp3: string;
            }
        }
    ];
}

export interface PdndResponse<T> {
    data?: T,
    error?: HttpErrorResponse
}

export enum PdndBaseUri {
    KEYS = 'keys',
    CLIENTS = 'clients',
    ORGANIZATIONS = 'organizations',
    ATTRIBUTES = 'attributes',
    ESERVICES = 'eservices',
    AGREEMENTS = 'agreements',
    PURPOSES = 'purposes',
    SERVICE_LIST = 'organizations/origin/{{organizationOrigin}}/externalId/{{organizationExternalId}}/eservices',
    EVENTS = 'events',
}

export enum PdndEventType {
    ANY = 1,
    ESERVICES,
    KEYS,
}

@Injectable({
    providedIn: 'root'
})
export class PdndService {
    constructor(private apiService: OpenAPIService) {

    }

    public keys(environmentId: string, kid: string) {
        return this.get<any>(`${environmentId}/keys/${kid}`);
    }

    public client(environmentId: string, clientId: string) {
        return this.get<ClientResponse>(`${environmentId}/clients/${clientId}`);
    }

    public organization(environmentId: string, organizationId: string) {
        return this.get<OrganizationResponse>(`${environmentId}/organizations/${organizationId}`);
    }

    public attribute(environmentId: string, attributeId: string) {
        return this.get<AttributeResponse>(`${environmentId}/attributes/${attributeId}`);
    }

    public eservice(environmentId: string, eserviceId: string) {
        return this.get<EserviceResponse>(`${environmentId}/eservices/${eserviceId}`);
    }

    public eserviceDescriptors(environmentId: string, eserviceId: string) {
        return this.get<EserviceDescriptorsResponse>(`${environmentId}/eservices/${eserviceId}/descriptors`);
    }

    public eserviceDescriptor(environmentId: string, eserviceId: string, descriptorId: string) {
        return this.get<EserviceDescriptor>(`${environmentId}/eservices/${eserviceId}/descriptors/${descriptorId}`);
    }

    public agreement(environmentId: string, agreementId: string) {
        return this.get<Agreement>(`${environmentId}/agreements/${agreementId}`);
    }

    public agreementAttributes(environmentId: string, agreementId: string) {
        return this.get<AgreementAttributesResponse>(`${environmentId}/agreements/${agreementId}/attributes`);
    }

    public agreementPurposes(environmentId: string, agreementId: string) {
        return this.get<AgreementPurposesResponse>(`${environmentId}/agreements/${agreementId}/purposes`);
    }

    public purpose(environmentId: string, purposeId: string) {
        return this.get<Purpose>(`${environmentId}/purposes/${purposeId}`);
    }

    public purposeAgreement(environmentId: string, purposeId: string) {
        return this.get<Agreement>(`${environmentId}/purposes/${purposeId}/agreement`);
    }

    public serviceList(environmentId: string, organizationOrigin: string, organizationExternalId: string, attributeOrigin: string, attributeCode: string) {
        let params = new HttpParams();
        params = params.append('attributeOrigin', attributeOrigin);
        params = params.append('attributeCode', attributeCode);

        return this.post<{ eservices: EserviceResponse[] }>(`${environmentId}/organizations/origin/${organizationOrigin}/externalId/${organizationExternalId}/eservices`, params);
    }

    public events(eventType: PdndEventType, environmentId: string, lastEventId: number, limit = 100) {
        let path: string;
        switch (eventType) {
            case PdndEventType.ESERVICES:
                path = `${environmentId}/events/eservices`;
                break;
            case PdndEventType.KEYS:
                path = `${environmentId}/events/keys`;
                break;
            default:
                path = `${environmentId}/events`;
                break;
        }


        let params = new HttpParams();
        params = params.append('lastEventId', lastEventId);
        params = params.append('limit', limit);

        return this.get<EventsResponse>(path, params);
    }

    private get<T>(url: string, params?: HttpParams): Observable<PdndResponse<T>> {
        return this.apiService.getListPDND(url, { params }).pipe(
            map((response) => {
                return { data: response };
            }),
            catchError((error: HttpErrorResponse) => {
                return of({ error: error });
            }),
        );
    }

    private post<T>(url: string, params?: HttpParams): Observable<PdndResponse<T>> {
        return this.apiService.postPDND(url, {}, { params }).pipe(
            map((response) => {
                return { data: response };
            }),
            catchError((error: HttpErrorResponse) => {
                return of({ error: error });
            }),
        );
    }
}