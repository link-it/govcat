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

export interface Agreement {
    id: string;
    eserviceId: string;
    descriptorId: string;
    producerId: string;
    consumerId: string;
    state: string;
    /** Sospensioni distinte per soggetto (solo integrazione v3). */
    suspendedByProducer?: boolean;
    suspendedByConsumer?: boolean;
    suspendedByPlatform?: boolean;
    /** Motivazione notificata al fruitore, presente con stato REJECTED. */
    rejectionReason?: string;
}

export interface Attribute { id: string, validity: string }

interface AgreementAttributesResponse {
    verified: Attribute[];
    certified: Attribute[];
    declared: Attribute[];
}

export interface Purpose {
    id: string;
    title?: string;
    /** Previsione di carico attiva (chiamate/giorno). */
    throughput: number;
    /** ACTIVE | DRAFT | SUSPENDED | WAITING_FOR_APPROVAL | ARCHIVED */
    state: string;
    /** Presente solo se esiste una versione in attesa di approvazione. */
    waitingForApproval?: {
        id: string;
        throughput: number;
    };
    /** Sospensioni distinte per soggetto (solo integrazione v3). */
    suspendedByProducer?: boolean;
    suspendedByConsumer?: boolean;
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

    /** Documento allegato a un descrittore (solo integrazione v3, lettura): risposta con il file e le intestazioni. */
    public downloadEserviceDescriptorDocument(environmentId: string, eserviceId: string, descriptorId: string, documentId: string) {
        return this.apiService.downloadPDND(`${environmentId}/eservices/${eserviceId}/descriptors/${descriptorId}/documents/${documentId}`);
    }

    /** Interfaccia (specifica dell'API erogata) di un descrittore: la v3 non ne espone i metadati, il nome arriva nella risposta. */
    public downloadEserviceDescriptorInterface(environmentId: string, eserviceId: string, descriptorId: string) {
        return this.apiService.downloadPDND(`${environmentId}/eservices/${eserviceId}/descriptors/${descriptorId}/interface`);
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

    /**
     * Issue 250 (Fase 2): approvazione dell'accordo di un fruitore (PENDING).
     * POST senza body ne` query param. Solo per utenti con ruolo PDND admin.
     */
    public approveAgreement(environmentId: string, agreementId: string) {
        return this.post<Agreement>(`${environmentId}/agreements/${agreementId}/approve`);
    }

    /**
     * Approvazione di una finalita` con richiesta di aumento delle chiamate giornaliere
     * (versione in attesa). Va passato l'id della finalita`, non quello della versione.
     */
    public approvePurpose(environmentId: string, purposeId: string) {
        return this.post<Purpose>(`${environmentId}/purposes/${purposeId}/approve`);
    }

    /**
     * Rifiuto, sospensione e riattivazione di accordi e finalita` (PDND v3, ruolo PDND admin).
     * La riattivazione revoca solo la sospensione dell'erogatore: l'oggetto restituito puo` restare sospeso.
     * Il rifiuto di una finalita` non e` esposto dalla PDND.
     */
    public rejectAgreement(environmentId: string, agreementId: string, reason: string) {
        return this.post<Agreement>(`${environmentId}/agreements/${agreementId}/reject`, undefined, { reason });
    }

    public suspendAgreement(environmentId: string, agreementId: string) {
        return this.post<Agreement>(`${environmentId}/agreements/${agreementId}/suspend`);
    }

    public unsuspendAgreement(environmentId: string, agreementId: string) {
        return this.post<Agreement>(`${environmentId}/agreements/${agreementId}/unsuspend`);
    }

    public suspendPurpose(environmentId: string, purposeId: string) {
        return this.post<Purpose>(`${environmentId}/purposes/${purposeId}/suspend`);
    }

    public unsuspendPurpose(environmentId: string, purposeId: string) {
        return this.post<Purpose>(`${environmentId}/purposes/${purposeId}/unsuspend`);
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

    private post<T>(url: string, params?: HttpParams, body: any = {}): Observable<PdndResponse<T>> {
        return this.apiService.postPDND(url, body, { params }).pipe(
            map((response) => {
                return { data: response };
            }),
            catchError((error: HttpErrorResponse) => {
                return of({ error: error });
            }),
        );
    }
}