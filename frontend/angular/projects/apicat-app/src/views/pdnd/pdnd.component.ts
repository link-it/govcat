import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { Attribute, EserviceDescriptor, EserviceResponse, OrganizationResponse, PdndBaseUri, PdndEventType, PdndResponse, PdndService } from './pdnd.service';
import { forkJoin, of } from 'rxjs';

import { PdndView } from './components/pdnd-view';
import { uuid } from 'projects/linkit/validators/src/lib/uuid/validator';

interface PdndType {
  uri: PdndBaseUri;
  label: string;
  controls: FormControl[];
  view?: PdndView[];
}

interface PdndFormValue {
  pdndType: PdndType;
  kid?: string;
  clientId?: string;
  organizationId?: string;
  attributeId?: string;
  eserviceId?: string;
  agreementId?: string;
  purposeId?: string;

  organizationOrigin?: string;
  organizationExternalId?: string;
  attributeOrigin?: string;
  attributeCode?: string;

  eventType?: PdndEventType;
  lastEventId?: number;
  limit?: number;
}

const clientDetailsConfiguration = [
  { "label": "APP.LABEL.ClientID", "field": "client_id", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.Organization", "field": "name", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.ConsumerId", "field": "consumer_id", "type": "text" },
  { "label": "APP.LABEL.ExternalId", "field": "origin_external", "type": "text" },
  { "label": "APP.LABEL.Category", "field": "category", "type": "text" }
];

const organizationDetailsConfiguration = [
  { "label": "APP.LABEL.Name", "field": "name", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.ConsumerId", "field": "consumer_id", "type": "text" },
  { "label": "APP.LABEL.ExternalId", "field": "origin_external", "type": "text" },
  { "label": "APP.LABEL.Category", "field": "category", "type": "text" }
];

const attributeDetailsConfiguration = [
  { "label": "APP.LABEL.Name", "field": "name", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.Type", "field": "type", "type": "text" },
];

const eserviceDetailsConfiguration = [
  { "label": "APP.LABEL.Name", "field": "name", "type": "text", "columns": 6 },
  {
    "field": "technology", "type": "label", "columns": 6, "options": {
      "label": "APP.LABEL.Type",
      "values": {
        "REST": { "label": "REST", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "SOAP": { "label": "SOAP", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  },
  { "label": "APP.LABEL.ServiceID", "field": "id", "type": "text" },
  { "label": "APP.LABEL.State", "field": "state", "type": "text" },
  { "label": "APP.LABEL.Description", "field": "description", "type": "text" },
];

const descriptorDetailsConfiguration = [
  { "label": "APP.LABEL.DescriptorID", "field": "id", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.Version", "field": "version", "type": "text" },
  { "label": "APP.LABEL.State", "field": "state", "type": "text" },
  { "label": "APP.LABEL.AudienceURL", "field": "audience_url", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.ServerURL", "field": "server_url", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.VoucherLifespan", "field": "voucher_lifespan", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.DailyCallsPerConsumer", "field": "daily_calls_per_consumer", "type": "text" },
  { "label": "APP.LABEL.DailyCallsTotal", "field": "daily_calls_total", "type": "text" },
  { "label": "APP.LABEL.Interface", "field": "interface_name", "type": "text" },
];

const descriptorColapseConfiguration = {
  "itemRow": {
    "primaryText": [{ "field": "id", "type": "text" }]
  }
}

const descriptorDownloadsListConfiguration = {
  "itemRow": {
    "primaryText": [{ "field": "name", "type": "text" }],
    "metadata": { "text": [{ "field": "contentType", "type": "text" }], "label": [] }
  }
}


const agreementDetailsConfiguration = [
  { "label": "APP.LABEL.State", "field": "state", "type": "text" }
];

const agreementAttributesListConfiguration = {
  "itemRow": {
    "primaryText": [
      { "field": "name", "type": "html" },
    ],
    "metadata": { "text": [{ "field": "id", "type": "text" }], "label": [] },
    "secondaryMetadata": [
      { "field": "validity", "type": "label", "options": "validity" },
      { "field": "type", "type": "label", "options": "type" }
    ]
  },
  "options": {
    "validity": {
      "label": "APP.LABEL.State",
      "small": true,
      "values": {
        "VALID": { "label": "APP.LABEL.Valid", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "INVALID": { "label": "APP.LABEL.Invalid", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    },
    "type": {
      "label": "APP.LABEL.Type",
      "small": true,
      "values": {
        "CERTIFIED": { "label": "APP.LABEL.PDND.Certified", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "DECLARED": { "label": "APP.LABEL.PDND.Declared", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
        "VERIFIED": { "label": "APP.LABEL.PDND.Verified", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  }
}


const purposeListConfiguration = {
  "itemRow": {
    "primaryText": [
      { "field": "id", "type": "text" },
    ],
    "metadata": {
      "text": [
        { "field": "throughput", "type": "text" },
      ],
      "label": []
    },
    "secondaryMetadata": [
      { "field": "state", "type": "label", "options": "state" },
    ]
  },

  "options": {
    "state": {
      "label": "APP.LABEL.State",
      "small": true,
      "values": {
        "ACTIVE": { "label": "ACTIVE", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "INACTIVE": { "label": "INACTIVE", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  }
}


const purposeDetailsConfiguration = [
  { "label": "APP.LABEL.Id", "field": "id", "type": "text", "columns": 6 },
  {
    "field": "state", "type": "label", "columns": 6, "options": {
      "label": "APP.LABEL.Type",
      "values": {
        "ACTIVE": { "label": "ACTIVE", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "INACTIVE": { "label": "INACTIVE", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  },
  { "label": "APP.LABEL.NoOfRequestsDaily", "field": "throughput", "type": "text" }
];

const eserviceListColapseConfiguration = {
  "itemRow": {
    "primaryText": [{ "field": "name", "type": "text" }]
  }
}

const eventListConfiguration = {
  "itemRow": {
    "primaryText": [
      { "field": "eventId", "type": "text" },
    ],
    "metadata": {
      "text": [
        { "field": "objectId.kid", "type": "text" },
      ],
      "label": []
    },
    "secondaryMetadata": [
      { "field": "eventType", "type": "label", "options": "eventType" },
      { "field": "objectType", "type": "label", "options": "objectType" },
    ]
  },

  "options": {
    "eventType": {
      "label": "APP.LABEL.EventType",
      "small": true,
      "values": {
      }
    },
    "objectType": {
      "label": "APP.LABEL.ObjectType",
      "small": true,
      "values": {
      }
    }
  }
}

@Component({
  selector: 'app-pdnd',
  templateUrl: 'pdnd.component.html',
  styleUrls: ['pdnd.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class PdndComponent {
  model = 'pdnd';
  environmentId: string = 'collaudo';

  _showFilter: boolean = true;

  _pdndType = new FormControl<PdndType | null>(null, [Validators.required]);
  _kid = new FormControl<string | null>(null, [Validators.required, Validators.pattern(/^\S*$/)]);
  _clientId = new FormControl<string | null>(null, [Validators.required, uuid()]);
  _organizationId = new FormControl<string | null>(null, [Validators.required, uuid()]);
  _attributeId = new FormControl<string | null>(null, [Validators.required, uuid()]);
  _eserviceId = new FormControl<string | null>(null, [Validators.required, uuid()]);
  _agreementId = new FormControl<string | null>(null, [Validators.required, uuid()]);
  _purposeId = new FormControl<string | null>(null, [Validators.required, uuid()]);

  _organizationOrigin = new FormControl<string | null>(null, [Validators.required]);
  _organizationExternalId = new FormControl<string | null>(null, [Validators.required]);
  _attributeOrigin = new FormControl<string | null>(null, [Validators.required]);
  _attributeCode = new FormControl<string | null>(null, [Validators.required]);

  _eventType = new FormControl<PdndEventType | null>(PdndEventType.ANY, [Validators.required]);
  _lastEventId = new FormControl<number | null>(null, [Validators.required, Validators.pattern('[0-9]*'), Validators.min(1)]);
  _limit = new FormControl<number | null>(100, [Validators.pattern('[0-9]*'), Validators.min(1)]);

  _formGroup: FormGroup = new FormGroup({
    pdndType: this._pdndType,
    kid: this._kid,
    clientId: this._clientId,
    organizationId: this._organizationId,
    attributeId: this._attributeId,
    eserviceId: this._eserviceId,
    agreementId: this._agreementId,
    purposeId: this._purposeId,

    organizationOrigin: this._organizationOrigin,
    organizationExternalId: this._organizationExternalId,
    attributeOrigin: this._attributeOrigin,
    attributeCode: this._attributeCode,

    eventType: this._eventType,
    lastEventId: this._lastEventId,
    limit: this._limit
  });

  _spin: boolean = false;
  _message: string = 'APP.MESSAGE.SelectRequest';
  _messageHelp: string = 'APP.MESSAGE.SelectRequestHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';
  _error: boolean = false;
  _errorMsg: string = '';
  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Pdnd', url: '', type: 'title', icon: '' }
  ];

  pdndTypes: PdndType[] = [
    { label: this.translate.instant('APP.LABEL.PDND.RetrieveKey'), uri: PdndBaseUri.KEYS, controls: [this._kid] },
    { label: this.translate.instant('APP.LABEL.PDND.Client'), uri: PdndBaseUri.CLIENTS, controls: [this._clientId], view: [{ title: this.translate.instant('APP.LABEL.PDND.Client'), type: 'ui-data-view', configuration: clientDetailsConfiguration }] },
    { label: this.translate.instant('APP.LABEL.PDND.Organization'), uri: PdndBaseUri.ORGANIZATIONS, controls: [this._organizationId], view: [{ title: this.translate.instant('APP.LABEL.PDND.Organization'), type: 'ui-data-view', configuration: organizationDetailsConfiguration }] },
    { label: this.translate.instant('APP.LABEL.PDND.Attribute'), uri: PdndBaseUri.ATTRIBUTES, controls: [this._attributeId], view: [{ title: this.translate.instant('APP.LABEL.PDND.Attribute'), type: 'ui-data-view', configuration: attributeDetailsConfiguration }] },
    {
      label: this.translate.instant('APP.LABEL.PDND.Service'), uri: PdndBaseUri.ESERVICES, controls: [this._eserviceId], view: [
        { title: this.translate.instant('APP.LABEL.PDND.Service'), type: 'pdnd-service-view', configuration: null }
      ]
    },
    {
      label: this.translate.instant('APP.LABEL.PDND.Agreement'), uri: PdndBaseUri.AGREEMENTS, controls: [this._agreementId], view: [
        { title: this.translate.instant('APP.LABEL.PDND.Agreement'), type: 'ui-data-view', configuration: agreementDetailsConfiguration },
        { title: this.translate.instant('APP.LABEL.PDND.Service'), type: 'ui-data-view', configuration: eserviceDetailsConfiguration },
        {
          title: this.translate.instant('APP.LABEL.PDND.Descriptor'),
          type: 'list-ui-collapse-row',
          configuration: descriptorDetailsConfiguration,
          collapseView: { configuration: descriptorColapseConfiguration, collapsed: true },
          listView: { title: this.translate.instant('APP.LABEL.Documents'), configuration: descriptorDownloadsListConfiguration }
        },
        { title: this.translate.instant('APP.LABEL.PDND.Producer'), type: 'ui-data-view', configuration: organizationDetailsConfiguration },
        { title: this.translate.instant('APP.LABEL.PDND.Consumer'), type: 'ui-data-view', configuration: organizationDetailsConfiguration },
        {
          title: this.translate.instant('APP.LABEL.PDND.Attributes'),
          type: 'list-ui-item-row',
          configuration: [],
          listView: { configuration: agreementAttributesListConfiguration }
        },
        {
          title: this.translate.instant('APP.LABEL.PDND.Purposes'),
          type: 'list-ui-item-row',
          configuration: [],
          listView: { configuration: purposeListConfiguration }
        },
      ]
    },
    {
      label: this.translate.instant('APP.LABEL.PDND.Purpose'), uri: PdndBaseUri.PURPOSES, controls: [this._purposeId], view: [
        { title: this.translate.instant('APP.LABEL.PDND.Purpose'), type: 'ui-data-view', configuration: purposeDetailsConfiguration },
        { title: this.translate.instant('APP.LABEL.PDND.Agreement'), type: 'ui-data-view', configuration: agreementDetailsConfiguration },
        { title: this.translate.instant('APP.LABEL.PDND.Service'), type: 'ui-data-view', configuration: eserviceDetailsConfiguration },
        {
          title: this.translate.instant('APP.LABEL.PDND.Descriptor'),
          type: 'list-ui-collapse-row',
          configuration: descriptorDetailsConfiguration,
          collapseView: { configuration: descriptorColapseConfiguration, collapsed: true },
          listView: { title: this.translate.instant('APP.LABEL.Documents'), configuration: descriptorDownloadsListConfiguration }
        },
        { title: this.translate.instant('APP.LABEL.PDND.Producer'), type: 'ui-data-view', configuration: organizationDetailsConfiguration },
        { title: this.translate.instant('APP.LABEL.PDND.Consumer'), type: 'ui-data-view', configuration: organizationDetailsConfiguration },
      ]
    },
    {
      label: this.translate.instant('APP.LABEL.PDND.ServiceList'), uri: PdndBaseUri.SERVICE_LIST, controls: [this._organizationOrigin, this._organizationExternalId, this._attributeOrigin, this._attributeCode],
      view: [
        {
          title: this.translate.instant('APP.LABEL.Services'),
          type: 'list-ui-collapse-row',
          configuration: eserviceDetailsConfiguration,
          collapseView: { configuration: eserviceListColapseConfiguration, collapsed: true }
        }
      ]
    },
    {
      label: this.translate.instant('APP.LABEL.PDND.Events'), uri: PdndBaseUri.EVENTS, controls: [this._eventType, this._lastEventId, this._limit], view: [
        {
          title: this.translate.instant('APP.LABEL.PDND.Events'),
          type: 'list-ui-item-row',
          configuration: [],
          listView: { configuration: eventListConfiguration }
        }
      ]
    },
  ];

  eventTypes: { value: PdndEventType, label: string }[] = [
    { value: PdndEventType.ANY, label: this.translate.instant('APP.LABEL.PDND.EventType.Any') },
    { value: PdndEventType.ESERVICES, label: this.translate.instant('APP.LABEL.PDND.EventType.Eservices') },
    { value: PdndEventType.KEYS, label: this.translate.instant('APP.LABEL.PDND.EventType.Keys') },
  ];

  jwk: any = null;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private pdndService: PdndService,
  ) {
    this._initForm();
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.SelectRequest';
      this._messageHelp = 'APP.MESSAGE.SelectRequestHelp';
    }
  }

  _onSubmit(formValue: PdndFormValue) {
    this._formGroup.markAllAsTouched();
    if (this._formGroup.invalid) return;

    this._clearResults();

    const onError = (error: any) => {
      this._spin = false;
      this._setErrorMessages(true);
      this._errorMsg = error.error?.message || error.message;
    }

    this._spin = true;
    this._setErrorMessages(false);
    this._errorMsg = '';
    switch (formValue.pdndType.uri) {
      case PdndBaseUri.KEYS:
        if (!formValue.kid) break;
        this.pdndService.keys(this.environmentId, formValue.kid).subscribe((result) => {
          this.jwk = result;
          this._spin = false;
        }, onError);
        break;
      case PdndBaseUri.CLIENTS:
        if (!formValue.clientId) break;
        this.pdndService.client(this.environmentId, formValue.clientId).subscribe((clientResponse) => {
          if (!clientResponse.data) {
            this.jwk = [clientResponse.error];
            this._spin = false;
            return;
          }
          const client = clientResponse.data;
          this.pdndService.organization(this.environmentId, clientResponse.data.consumerId).subscribe((organizationResponse) => {
            if (!organizationResponse.data) {
              this.jwk = [organizationResponse.error];
              return;
            }
            const organization = organizationResponse.data;
            this.jwk = [{
              client_id: client.id,
              consumer_id: client.consumerId,
              name: organization.name,
              origin_external: organization.externalId.origin + ' ' + organization.externalId.id,
              category: organization.category
            }];
            this._spin = false;
          }, onError);
        }, onError);
        break;
      case PdndBaseUri.ORGANIZATIONS:
        if (!formValue.organizationId) break;
        this.pdndService.organization(this.environmentId, formValue.organizationId).subscribe((organizationResponse) => {
          this._spin = false;
          if (!organizationResponse.data) {
            this.jwk = [organizationResponse.error];
            return;
          }
          const organization = organizationResponse.data;
          this.jwk = [{
            name: organization.name,
            consumer_id: organization.id,
            origin_external: organization.externalId.origin + ' ' + organization.externalId.id,
            category: organization.category
          }];
        }, onError);
        break;
      case PdndBaseUri.ATTRIBUTES:
        if (!formValue.attributeId) break;
        this.pdndService.attribute(this.environmentId, formValue.attributeId).subscribe((result) => {
          this._spin = false;
          if (!result.data) {
            this.jwk = [result.error];
            return;
          }
          this.jwk = [{
            name: result.data.name,
            type: this.translate.instant('APP.LABEL.PDND.AttributeType.' + result.data.kind)
          }];
        }, onError);
        break;
      case PdndBaseUri.ESERVICES:
        if (!formValue.eserviceId) break;

        setTimeout(() => {
          this.jwk = [formValue.eserviceId];
        });

        break;
      case PdndBaseUri.AGREEMENTS:
        if (!formValue.agreementId) break;
        forkJoin({
          agreementResponse: this.pdndService.agreement(this.environmentId, formValue.agreementId),
          attributesResponse: this.pdndService.agreementAttributes(this.environmentId, formValue.agreementId),
          purposesResponse: this.pdndService.agreementPurposes(this.environmentId, formValue.agreementId)
        }).subscribe(({ agreementResponse, attributesResponse, purposesResponse }) => {
          let agreementMap: any = null;
          let purposesMap: any = null;
          let mergedAttributesMap: any = null;

          if (agreementResponse.data) {
            agreementMap = {
              state: agreementResponse.data.state
            };
          }

          if (purposesResponse.data) {
            purposesMap = purposesResponse.data.purposes.map((purpose: any) => {
              return {
                id: purpose.id,
                state: purpose.state,
                throughput: this.translate.instant('APP.LABEL.PDND.Throughput') + ': ' + purpose.throughput,
              }
            });
          }

          const translatedNameLoadTooltip = this.translate.instant('APP.LABEL.LoadName');

          if (attributesResponse.data) {
            let attributes = attributesResponse.data;

            const attributesMapper = (type: string) => {
              return (attribute: Attribute) => {
                return {
                  _id: attribute.id,
                  id: '',
                  validity: attribute.validity,
                  type: type,
                  name: `<span class="name-info bi-info-circle" title="${translatedNameLoadTooltip}"></span><span class="attribute-id-name" title="${translatedNameLoadTooltip}">${attribute.id}</span>`
                };
              }
            };

            const certifiedAttributes = attributes.certified.map(
              attributesMapper(this.translate.instant('APP.LABEL.PDND.AttributeType.CERTIFIED'))
            );

            const declaredAttributes = attributes.declared.map(
              attributesMapper(this.translate.instant('APP.LABEL.PDND.AttributeType.DECLARED'))
            );

            const verifiedAttributes = attributes.verified.map(
              attributesMapper(this.translate.instant('APP.LABEL.PDND.AttributeType.VERIFIED'))
            );

            mergedAttributesMap = [
              ...certifiedAttributes,
              ...declaredAttributes,
              ...verifiedAttributes
            ];
          }

          forkJoin({
            producerResponse: agreementResponse.data ? this.pdndService.organization(this.environmentId, agreementResponse.data.producerId) : of({ error: agreementResponse.error } as PdndResponse<OrganizationResponse>),
            consumerResponse: agreementResponse.data ? this.pdndService.organization(this.environmentId, agreementResponse.data.consumerId) : of({ error: agreementResponse.error } as PdndResponse<OrganizationResponse>),
            eServiceResponse: agreementResponse.data ? this.pdndService.eservice(this.environmentId, agreementResponse.data.eserviceId) : of({ error: agreementResponse.error } as PdndResponse<EserviceResponse>),
            descriptorResponse: agreementResponse.data ? this.pdndService.eserviceDescriptor(this.environmentId, agreementResponse.data.eserviceId, agreementResponse.data.descriptorId) : of({ error: agreementResponse.error } as PdndResponse<EserviceDescriptor>),
          }).subscribe(({ producerResponse, consumerResponse, eServiceResponse, descriptorResponse }) => {
            this._spin = false;

            let eServiceMap: any = null;
            let descriptorsMap: any = null;
            let producerMap: any = null;
            let consumerMap: any = null;

            if (eServiceResponse.data) {
              let eService = eServiceResponse.data;
              eServiceMap = {
                id: eService.id,
                name: `${eService.name} v. ${eService.version}`,
                technology: eService.technology,
                state: eService.state,
                description: eService.description,
              };
            }

            if (descriptorResponse.data) {
              let descriptor = descriptorResponse.data;
              descriptorsMap = [{
                data: {
                  id: descriptor.id,
                  version: descriptor.version,
                  state: descriptor.state,
                  audience_url: descriptor.audience.pop(),
                  server_url: descriptor.serverUrls.pop(),
                  voucher_lifespan: descriptor.voucherLifespan,
                  daily_calls_per_consumer: descriptor.dailyCallsPerConsumer,
                  daily_calls_total: descriptor.dailyCallsTotal,
                  interface_name: descriptor.interface.name,
                }, list: descriptor.docs
              }];
            }

            if (producerResponse.data) {
              let producer = producerResponse.data;
              producerMap = {
                name: producer.name,
                consumer_id: producer.id,
                origin_external: producer.externalId.origin + ' ' + producer.externalId.id,
                category: producer.category
              };
            }

            if (consumerResponse.data) {
              let consumer = consumerResponse.data;
              consumerMap = {
                name: consumer.name,
                consumer_id: consumer.id,
                origin_external: consumer.externalId.origin + ' ' + consumer.externalId.id,
                category: consumer.category
              };
            }

            this.jwk = [
              agreementMap ? agreementMap : agreementResponse.error,
              eServiceMap ? eServiceMap : eServiceResponse.error,
              descriptorsMap ? descriptorsMap : descriptorResponse.error,
              producerMap ? producerMap : producerResponse.error,
              consumerMap ? consumerMap : consumerResponse.error,
              mergedAttributesMap ? mergedAttributesMap : attributesResponse.error,
              purposesMap ? purposesMap : purposesResponse.error
            ];
          });
        }, onError);
        break;
      case PdndBaseUri.PURPOSES:
        if (!formValue.purposeId) break;
        forkJoin({
          purposeResponse: this.pdndService.purpose(this.environmentId, formValue.purposeId),
          purposeAgreementResponse: this.pdndService.purposeAgreement(this.environmentId, formValue.purposeId)
        }).subscribe(({ purposeResponse, purposeAgreementResponse }) => {

          let purposeMap: any = null;
          let purposeAgreementMap: any = null;

          if (purposeResponse.data) {
            purposeMap = purposeResponse.data;
          }

          if (purposeAgreementResponse.data) {
            purposeAgreementMap = {
              state: purposeAgreementResponse.data.state
            }
          }

          forkJoin({
            eServiceResponse: purposeAgreementResponse.data ? this.pdndService.eservice(this.environmentId, purposeAgreementResponse.data.eserviceId) : of({ error: purposeAgreementResponse.error } as PdndResponse<EserviceResponse>),
            descriptorResponse: purposeAgreementResponse.data ? this.pdndService.eserviceDescriptor(this.environmentId, purposeAgreementResponse.data.eserviceId, purposeAgreementResponse.data.descriptorId) : of({ error: purposeAgreementResponse.error } as PdndResponse<EserviceDescriptor>),
            producerResponse: purposeAgreementResponse.data ? this.pdndService.organization(this.environmentId, purposeAgreementResponse.data.producerId) : of({ error: purposeAgreementResponse.error } as PdndResponse<OrganizationResponse>),
            consumerResponse: purposeAgreementResponse.data ? this.pdndService.organization(this.environmentId, purposeAgreementResponse.data.consumerId) : of({ error: purposeAgreementResponse.error } as PdndResponse<OrganizationResponse>)
          }).subscribe(({ eServiceResponse, descriptorResponse, producerResponse, consumerResponse }) => {
            this._spin = false;

            let eServiceMap: any = null;
            let descriptorsMap: any = null;
            let producerMap: any = null;
            let consumerMap: any = null;

            if (eServiceResponse.data) {
              let eService = eServiceResponse.data;
              eServiceMap = {
                id: eService.id,
                name: `${eService.name} v. ${eService.version}`,
                technology: eService.technology,
                state: eService.state,
                description: eService.description,
              }
            }

            if (descriptorResponse.data) {
              let descriptor = descriptorResponse.data;
              descriptorsMap = [{
                data: {
                  id: descriptor.id,
                  version: descriptor.version,
                  state: descriptor.state,
                  audience_url: descriptor.audience.pop(),
                  server_url: descriptor.serverUrls.pop(),
                  voucher_lifespan: descriptor.voucherLifespan,
                  daily_calls_per_consumer: descriptor.dailyCallsPerConsumer,
                  daily_calls_total: descriptor.dailyCallsTotal,
                  interface_name: descriptor.interface.name,
                }, list: descriptor.docs
              }];
            }

            if (producerResponse.data) {
              let producer = producerResponse.data;
              producerMap = {
                name: producer.name,
                consumer_id: producer.id,
                origin_external: producer.externalId.origin + ' ' + producer.externalId.id,
                category: producer.category
              }
            }

            if (consumerResponse.data) {
              let consumer = consumerResponse.data;
              consumerMap = {
                name: consumer.name,
                consumer_id: consumer.id,
                origin_external: consumer.externalId.origin + ' ' + consumer.externalId.id,
                category: consumer.category
              };
            }

            this.jwk = [
              purposeMap ? purposeMap : purposeResponse.error,
              purposeAgreementMap ? purposeAgreementMap : purposeAgreementResponse.error,
              eServiceMap ? eServiceMap : eServiceResponse.error,
              descriptorsMap ? descriptorsMap : descriptorResponse.error,
              producerMap ? producerMap : producerResponse.error,
              consumerMap ? consumerMap : consumerResponse.error
            ];
          })
        }, onError);
        break;
      case PdndBaseUri.SERVICE_LIST:
        if (!formValue.organizationOrigin || !formValue.organizationExternalId || !formValue.attributeOrigin || !formValue.attributeCode) break;
        this.pdndService.serviceList(this.environmentId, formValue.organizationOrigin, formValue.organizationExternalId, formValue.attributeOrigin, formValue.attributeCode).subscribe((eServicesResponse) => {
          let servicesMap: any = null;

          if (eServicesResponse.data) {
            servicesMap = eServicesResponse.data.eservices.map((eService) => {
              return {
                data: {
                  id: eService.id,
                  name: `${eService.name} v. ${eService.version}`,
                  technology: eService.technology,
                  state: eService.state,
                  description: eService.description,
                }, list: []
              };
            });
          }

          this.jwk = [
            servicesMap ? servicesMap : eServicesResponse.error,
          ];
          this._spin = false;
        }, onError);
        break;
      case PdndBaseUri.EVENTS:
        if (!formValue.eventType || !formValue.lastEventId || !formValue.limit) break;
        this.pdndService.events(formValue.eventType, this.environmentId, formValue.lastEventId, formValue.limit).subscribe((result) => {
          this._spin = false;

          let eventsMap: any = null;

          if (result.data) {
            eventsMap = result.data.events.sort((a, b) => a.eventId < b.eventId ? 1 : -1)
          }

          this.jwk = [eventsMap ? eventsMap : result.error];
        }, onError);
        break;
    }
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  download(jwk: any) {
    const blob = new Blob([JSON.stringify(jwk, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("download", (jwk.kid ? jwk.kid : 'chiave') + ".jwk");
    link.setAttribute("href", url);
    link.click();
  }

  onItemClick(item: any, collection: any, itemIndex: number) {
    if(!item._id || item.id) return;
    this.pdndService.attribute(this.environmentId, item._id).subscribe((result) => {
      if(!result.data) return;
      const clonedItem = JSON.parse(JSON.stringify(item));
      clonedItem.id = item._id;
      clonedItem.name = result.data?.name;
      collection[itemIndex] = clonedItem;
    });
  }

  _resetData() {
    this._spin = false;
    this._clearResults();
    this._setErrorMessages(false);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this._resetData();
  }

  _showProduzione() {
    this.environmentId = 'produzione';
    this._resetData();
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  _toggleFilter() {
    this._showFilter = !this._showFilter;
  }

  private _initForm() {
    this.disableAll();
    this._pdndType.valueChanges.subscribe((value) => {
      this._clearResults();
      this.disableAll();
      this._formGroup.markAsPristine();
      this._formGroup.markAsUntouched();
      this._formGroup.updateValueAndValidity();

      value?.controls.forEach(control => control.enable());
    });
  }

  private disableAll() {
    this._kid.disable();
    this._clientId.disable();
    this._organizationId.disable();
    this._attributeId.disable();
    this._eserviceId.disable();
    this._agreementId.disable();
    this._purposeId.disable();

    this._organizationOrigin.disable();
    this._organizationExternalId.disable();
    this._attributeOrigin.disable();
    this._attributeCode.disable();

    this._eventType.disable();
    this._lastEventId.disable();
    this._limit.disable();
  }

  private _clearResults() {
    this.jwk = null;
  }
}
