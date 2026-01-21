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
import { ClickOutsideDirective } from "./click-outside.directive";
import { CountUpDirective } from "./count-up.directive";
import { HtmlAttributesDirective } from "./html-attr.directive";
import { TextLowercaseDirective } from "./lowercase.directive";
import { MarkAsteriskDirective } from "./mark-asterisk.directive";
import { RouterLinkMatchDirective } from "./router-link-match.directive";
import { SetBackgroundImageDirective } from "./set-background-image.directive";
import { TextUppercaseDirective } from "./uppercase.directive";

export const directives = [
    CountUpDirective,
    ClickOutsideDirective,
    HtmlAttributesDirective,
    TextLowercaseDirective,
    RouterLinkMatchDirective,
    SetBackgroundImageDirective,
    TextUppercaseDirective,
    MarkAsteriskDirective
]

export {
    CountUpDirective, 
    ClickOutsideDirective, 
    HtmlAttributesDirective,
    TextLowercaseDirective,
    RouterLinkMatchDirective,
    SetBackgroundImageDirective,
    TextUppercaseDirective,
    MarkAsteriskDirective
};