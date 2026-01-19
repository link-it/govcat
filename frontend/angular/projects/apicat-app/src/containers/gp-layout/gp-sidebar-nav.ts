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
export interface INavAttributes {
    [propName: string]: any;
}

export interface INavBadge {
    text: string;
    variant: string;
    class?: string;
}

export interface INavLabel {
    class?: string;
    variant: string;
}

export interface INavData {
    label?: string;
    path?: string;
    url?: string | any[];
    href?: string;
    icon?: string;
    iconBs?: string;
    image?: string;
    title?: boolean;
    divider?: boolean;
    class?: string;
    attributes?: INavAttributes;
    permission?: string;
    children?: INavData[];
    expanded?: boolean;
    counter?: string;
}
