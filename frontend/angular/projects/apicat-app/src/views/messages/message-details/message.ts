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
import * as moment from 'moment';

export class Message {

  id: number | null = null;
  legal_name: string | null = null;
  office_at: string | null = null;
  office_address: string | null = null;
  office_address_details: string | null = null;
  office_zip: string | null = null;
  office_municipality: string | null = null;
  office_municipality_details: string | null = null;
  office_province: string | null = null;
  office_foreign_state: string | null = null;
  office_phone_number: string | null = null;
  office_email_address: string | null = null;
  office_pec_address: string | null = null;
  tax_code: string | null = null;
  logo_miniature: string | null = null; // Base64 Image
  logo: string | null = null; // Base64 Image

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
