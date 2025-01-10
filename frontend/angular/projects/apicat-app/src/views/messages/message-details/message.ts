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
