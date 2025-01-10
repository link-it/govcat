export interface PdndView {
    type: 'ui-data-view' | 'list-ui-item-row' | 'ui-collapse-row' | 'list-ui-collapse-row' | 'pdnd-service-view',
    title?: string,
    hideContent?: boolean,
    configuration: any,
    collapseView?: { configuration: any, collapsed: boolean }
    listView?: { title?: string, configuration: any }
}