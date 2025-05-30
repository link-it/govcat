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
