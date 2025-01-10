export enum NotificationType {
  Comunicazione = 'comunicazione',
  CambioStato = 'cambio_stato'
}

export enum NotificationState {
  Tutte = 'tutte',
  Nuova = 'nuova',
  Letta = 'letta',
  Archiviata = 'archiviata',
}

export enum NotificationEntityType {
  Servizio = 'servizio',
  Adesione = 'adesione'
}

export interface MenuSelectType {
  value: string;
  label: string;
}
