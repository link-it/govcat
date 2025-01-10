import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { forkJoin } from "rxjs";

import { GroupOrSingleAttribute, PdndService } from "../pdnd.service";

import { PdndView } from "./pdnd-view";

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

const organizationDetailsConfiguration = [
  { "label": "APP.LABEL.Name", "field": "name", "type": "text", "columns": 12 },
  { "label": "APP.LABEL.ConsumerId", "field": "consumer_id", "type": "text" },
  { "label": "APP.LABEL.ExternalId", "field": "origin_external", "type": "text" },
  { "label": "APP.LABEL.Category", "field": "category", "type": "text" }
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

const attributeColapseConfiguration = {
  "itemRow": {
    "primaryText": [{ "field": "name", "type": "label", "options": "type" }]
  },
  "options": {
    "type": {
      "label": "APP.LABEL.Type",
      "values": {
        "SINGLE": { "label": "APP.LABEL.PDND.Single", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "GROUP": { "label": "APP.LABEL.PDND.Group", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  }
}

const attributeListConfiguration = {
  "itemRow": {
    "primaryText": [
      { "field": "code", "type": "text" },
      { "field": "origin", "type": "text" }
    ],
    "metadata": {
      "text": [
        { "field": "id", "type": "text" },
      ],
      "label": []
    },
    "secondaryMetadata": [
      { "field": "explicitAttributeVerification", "type": "label", "options": "explicitAttributeVerification" }
    ]
  },
  "options": {
    "explicitAttributeVerification": {
      "label": "APP.LABEL.PDND.ExplicitAttributeVerification",
      "small": true,
      "values": {
        "true": { "label": "APP.LABEL.Yes", "background": "#c7f9cc", "border": "#c7f9cc", "color": "#1f1f1f" },
        "false": { "label": "APP.LABEL.No", "background": "#22577a", "border": "#22577a", "color": "#ffffff" },
      }
    }
  }
}

@Component({
  selector: 'pdnd-service-view',
  templateUrl: 'pdnd-eservice-view.component.html',
  styleUrls: ['pdnd-eservice-view.component.scss']
})
export class PdndEServiceViewComponent implements OnChanges {
  public views: PdndView[] = [
    { title: this.translate.instant('APP.LABEL.PDND.Service'), type: 'ui-data-view', configuration: eserviceDetailsConfiguration },
    { title: this.translate.instant('APP.LABEL.PDND.Organization'), type: 'ui-data-view', configuration: organizationDetailsConfiguration },
    // { type: 'ui-collapse-row', configuration: descriptorDetailsConfiguration, collapseView: { configuration: descriptorColapseConfiguration, collapsed: true }},
    {
      title: this.translate.instant('APP.LABEL.PDND.Descriptors'),
      type: 'list-ui-collapse-row',
      configuration: descriptorDetailsConfiguration,
      collapseView: { configuration: descriptorColapseConfiguration, collapsed: true },
      listView: { title: this.translate.instant('APP.LABEL.Documents'), configuration: descriptorDownloadsListConfiguration }
    },
    {
      title: this.translate.instant('APP.LABEL.PDND.CertifiedAttributes'),
      type: 'list-ui-collapse-row',
      configuration: [],
      hideContent: true,
      collapseView: { configuration: attributeColapseConfiguration, collapsed: true },
      listView: { configuration: attributeListConfiguration }
    },
    {
      title: this.translate.instant('APP.LABEL.PDND.DeclaredAttributes'),
      type: 'list-ui-collapse-row',
      configuration: [],
      hideContent: true,
      collapseView: { configuration: attributeColapseConfiguration, collapsed: true },
      listView: { configuration: attributeListConfiguration }
    },
    {
      title: this.translate.instant('APP.LABEL.PDND.VerifiedAttributes'),
      type: 'list-ui-collapse-row',
      configuration: [],
      hideContent: true,
      collapseView: { configuration: attributeColapseConfiguration, collapsed: true },
      listView: { configuration: attributeListConfiguration }
    },
  ];

  public data: any = null;

  @Output() public loading = new EventEmitter<boolean>();

  @Input() eServiceId: string|null = null;
  @Input() environmentId: string|null = null;

  private _eServiceId: string|null = null;
  private _environmentId: string|null = null;

  constructor(private translate: TranslateService, private pdndService: PdndService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.eServiceId) {
      this._eServiceId = changes.eServiceId.currentValue;
    }
    if (changes.environmentId) {
      this._environmentId = changes.environmentId.currentValue;
    }
    if(this._eServiceId && this._environmentId) {
      this.loadData();
    }
  }

  private loadData() {
    if(!this._eServiceId || !this._environmentId) {
      console.error('PdndEServiceViewComponent: Missing eServiceId or environmentId');
      return;
    }

    this.loading.emit(true);

    forkJoin({
      eServiceResponse: this.pdndService.eservice(this._environmentId, this._eServiceId),
      eServiceDescriptorsResponse: this.pdndService.eserviceDescriptors(this._environmentId, this._eServiceId)
    }).subscribe(({ eServiceResponse, eServiceDescriptorsResponse }) => {
      this.loading.emit(false);
      let eServiceMap: any = null;
      let organizationMap: any = null;
      let certifiedAttributesMap: any = null;
      let declaredAttributesMap: any = null;
      let verifiedAttributesMap: any = null;

      if (eServiceResponse.data) {
        const eService = eServiceResponse.data;

        eServiceMap = {
          id: eService.id,
          name: `${eService.name} v. ${eService.version}`,
          technology: eService.technology,
          state: eService.state,
          description: eService.description,
        }

        let organization = eService.producer;

        organizationMap = {
          name: organization.name,
          consumer_id: organization.id,
          origin_external: organization.externalId.origin + ' ' + organization.externalId.id,
          category: organization.category
        };

        const attributesMapper = (attribute: GroupOrSingleAttribute, index: number) => {
          const list = attribute.single ? [attribute.single] : attribute.group;
          const name = attribute.single ? 'SINGLE' : 'GROUP';
          return {
            data: {
              name: name,
            }, list: list?.map((item: any) => {
              return {
                id: item.id,
                code: item.code,
                origin: item.origin,
                explicitAttributeVerification: item.explicitAttributeVerification ? 'true' : 'false'
              }
            })
          }
        }

        certifiedAttributesMap = eService.attributes.certified?.map(attributesMapper);
        declaredAttributesMap = eService.attributes.declared?.map(attributesMapper);
        verifiedAttributesMap = eService.attributes.verified?.map(attributesMapper);
      }
     

      let descriptorsMap: any = null;
      if (eServiceDescriptorsResponse.data) {
        descriptorsMap = eServiceDescriptorsResponse.data.descriptors
        .sort((a, b) => a.version < b.version ? 1 : -1)
        .map(descriptor => {
          return {
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
          }
        });
      }

      this.data = [
        eServiceMap ? eServiceMap : eServiceResponse.error,
        organizationMap ? organizationMap : eServiceResponse.error,
        descriptorsMap ? descriptorsMap : eServiceDescriptorsResponse.error,
        certifiedAttributesMap ? certifiedAttributesMap : eServiceResponse.error,
        declaredAttributesMap ? declaredAttributesMap : eServiceResponse.error,
        verifiedAttributesMap ? verifiedAttributesMap : eServiceResponse.error
      ];
    }, (error) => { 
      this.loading.emit(false);
      console.error('PdndEServiceViewComponent: Error loading data', error);
    });
  }
}
