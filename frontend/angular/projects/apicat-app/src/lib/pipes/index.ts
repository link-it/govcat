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
import { PluralTranslatePipe } from './plural-translate.pipe';
import { PropertyFilterPipe } from './service-filters';
import { OrderByPipe } from './ordeby.pipe';
import { HighlighterPipe } from './highlighter.pipe';
import { MapperPipe } from './mapper.pipe';
import { PrettyjsonPipe } from './pretty-json.pipe';
import { ThousandSuffixesPipe } from './thousand-suff.pipe';
import { SafeHtmlPipe } from './safe-html.pipe';
import { SafeUrlPipe } from './safe-url.pipe';
import { HttpImgSrcPipe } from './http-img-src.pipe';

export const pipes = [
    PluralTranslatePipe,
    PropertyFilterPipe,
    OrderByPipe,
    HighlighterPipe,
    MapperPipe,
    PrettyjsonPipe,
    ThousandSuffixesPipe,
    SafeHtmlPipe,
    SafeUrlPipe,
    HttpImgSrcPipe
];

export {
    PluralTranslatePipe,
    PropertyFilterPipe,
    OrderByPipe,
    HighlighterPipe,
    MapperPipe,
    PrettyjsonPipe,
    ThousandSuffixesPipe,
    SafeHtmlPipe,
    SafeUrlPipe,
    HttpImgSrcPipe
};
