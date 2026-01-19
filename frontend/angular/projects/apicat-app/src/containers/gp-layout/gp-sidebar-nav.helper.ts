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
