/**
 * Impostazioni notifiche server-side.
 *
 * Logica:
 * - {} vuoto = tutte le notifiche abilitate (in-app + email)
 * - Array vuoti [] = tutte le notifiche disabilitate
 * - Sezione assente = quella sezione tutta abilitata
 * - Ogni elemento ha versione base (in-app) e _email
 *
 * Esempio con tutto abilitato:
 * {
 *   "emetti_per_tipi": ["comunicazione", "comunicazione_email", "cambio_stato", "cambio_stato_email"],
 *   "emetti_per_entita": ["servizio", "servizio_email", "adesione", "adesione_email"],
 *   "emetti_per_ruoli": ["servizio_referente_dominio", "servizio_referente_dominio_email", ...]
 * }
 */
export class ServerSettings {

  emetti_per_tipi?: string[];
  emetti_per_entita?: string[];
  emetti_per_ruoli?: string[];

  constructor(_data?: any) {
    if (_data) {
      this.initializeFromData(_data);
    }
  }

  private initializeFromData(_data: any): void {
    // Assegna solo se presente nei dati
    if (_data.emetti_per_tipi !== undefined) {
      this.emetti_per_tipi = _data.emetti_per_tipi;
    }
    if (_data.emetti_per_entita !== undefined) {
      this.emetti_per_entita = _data.emetti_per_entita;
    }
    if (_data.emetti_per_ruoli !== undefined) {
      this.emetti_per_ruoli = _data.emetti_per_ruoli;
    }
  }

  /**
   * Verifica se tutte le notifiche sono disabilitate
   */
  get isAllDisabled(): boolean {
    return this.emetti_per_tipi?.length === 0 &&
           this.emetti_per_entita?.length === 0 &&
           this.emetti_per_ruoli?.length === 0;
  }

  /**
   * Verifica se la configurazione è vuota (tutte abilitate)
   */
  get isAllEnabled(): boolean {
    return this.emetti_per_tipi === undefined &&
           this.emetti_per_entita === undefined &&
           this.emetti_per_ruoli === undefined;
  }
}
