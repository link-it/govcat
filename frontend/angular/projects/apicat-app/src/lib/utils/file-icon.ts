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

/** Icone Bootstrap per tipo MIME (corrispondenza esatta). */
const ICONE_PER_MIME: Record<string, string> = {
  'application/pdf': 'bi-filetype-pdf',
  'application/json': 'bi-filetype-json',
  'application/yaml': 'bi-filetype-yml',
  'application/x-yaml': 'bi-filetype-yml',
  'text/yaml': 'bi-filetype-yml',
  'text/x-yaml': 'bi-filetype-yml',
  'application/xml': 'bi-filetype-xml',
  'text/xml': 'bi-filetype-xml',
  'application/wsdl+xml': 'bi-filetype-xml',
  'text/html': 'bi-filetype-html',
  'text/csv': 'bi-filetype-csv',
  'text/plain': 'bi-filetype-txt',
  'text/markdown': 'bi-filetype-md',
  'application/msword': 'bi-filetype-doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bi-filetype-docx',
  'application/vnd.ms-excel': 'bi-filetype-xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bi-filetype-xlsx',
  'application/vnd.ms-powerpoint': 'bi-filetype-ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'bi-filetype-pptx',
  'application/zip': 'bi-file-earmark-zip',
  'application/x-zip-compressed': 'bi-file-earmark-zip',
  'image/png': 'bi-filetype-png',
  'image/jpeg': 'bi-filetype-jpg',
  'image/gif': 'bi-filetype-gif',
  'image/svg+xml': 'bi-filetype-svg'
};

/** Icone per estensione, se il tipo MIME manca o e` generico. */
const ICONE_PER_ESTENSIONE: Record<string, string> = {
  pdf: 'bi-filetype-pdf', json: 'bi-filetype-json', yaml: 'bi-filetype-yml', yml: 'bi-filetype-yml',
  xml: 'bi-filetype-xml', wsdl: 'bi-filetype-xml', xsd: 'bi-filetype-xml', html: 'bi-filetype-html', htm: 'bi-filetype-html',
  csv: 'bi-filetype-csv', txt: 'bi-filetype-txt', md: 'bi-filetype-md', doc: 'bi-filetype-doc', docx: 'bi-filetype-docx',
  xls: 'bi-filetype-xls', xlsx: 'bi-filetype-xlsx', ppt: 'bi-filetype-ppt', pptx: 'bi-filetype-pptx',
  zip: 'bi-file-earmark-zip', png: 'bi-filetype-png', jpg: 'bi-filetype-jpg', jpeg: 'bi-filetype-jpg',
  gif: 'bi-filetype-gif', svg: 'bi-filetype-svg'
};

/** Icona generica di un file (tipo sconosciuto). */
export const ICONA_FILE_GENERICA = 'bi-file-earmark';

/**
 * Icona Bootstrap coerente con il tipo MIME del file (parametri come `; charset=` ignorati),
 * con l'estensione del nome come riserva e l'icona generica se nessuna delle due e` nota.
 */
export function iconaPerFile(contentType: string | null | undefined, nome?: string | null): string {
  const _mime = (contentType || '').split(';')[0].trim().toLowerCase();
  if (ICONE_PER_MIME[_mime]) { return ICONE_PER_MIME[_mime]; }
  if (_mime.endsWith('+json')) { return 'bi-filetype-json'; }
  if (_mime.endsWith('+xml')) { return 'bi-filetype-xml'; }
  const _estensione = (nome || '').split('.').pop()?.toLowerCase() || '';
  if (nome?.includes('.') && ICONE_PER_ESTENSIONE[_estensione]) { return ICONE_PER_ESTENSIONE[_estensione]; }
  if (_mime.startsWith('image/')) { return 'bi-file-earmark-image'; }
  if (_mime.startsWith('text/')) { return 'bi-file-earmark-text'; }
  return ICONA_FILE_GENERICA;
}
