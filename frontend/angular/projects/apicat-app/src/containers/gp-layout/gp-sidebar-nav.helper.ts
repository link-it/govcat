import { Injectable } from '@angular/core';

import { INavData } from './gp-sidebar-nav';

@Injectable()
export class GpSidebarNavHelper {

    constructor() { }

    public itemType(item: INavData) {
        if (item.divider) {
            return 'divider';
        } else if (item.title) {
            return 'title';
        } else if (item.children) {
            return 'dropdown';
        } else if (item.label) {
            return 'label';
        } else if (!Object.keys(item).length) {
            return 'empty';
        } else {
            return 'link';
        }
    }

    public isTitle = (item: INavData) => Boolean(item.title);
    public isDivider = (item: INavData) => Boolean(item.divider);
    // public isMenu = (item: INavData) => !(Boolean(item.title) || Boolean(item.divider));
    public isMenu = (item: INavData) => !(Boolean(item.divider) || this.hasChildren(item));
    public hasIcon = (item: INavData) => Boolean(item.icon);
    public hasIconBs = (item: INavData) => Boolean(item.iconBs);
    public hasChildren = (item: INavData) => Boolean(item.children && item.children.length);
}
