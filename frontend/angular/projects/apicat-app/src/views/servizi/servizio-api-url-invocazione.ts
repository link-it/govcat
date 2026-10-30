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
import { Tools } from '@linkit/components';

import { UrlInvocazioneConfigurata } from './servizio-api-details/servizio-api-interfaces';

export type AmbienteUrlInvocazione = 'collaudo' | 'produzione';

/** Identificativo riservato della URL di invocazione predefinita. */
export const URL_INVOCAZIONE_DEFAULT = 'default';

/** Configurazione remota `servizio.api.url_invocazione` (assente se non censita). */
function configurazioneUrlInvocazione(): any {
    return Tools.Configurazione?.servizio?.api?.url_invocazione || null;
}

/** URL censite in configurazione per l'ambiente (lista vuota se nessuna). */
export function urlInvocazioneConfigurate(ambiente: AmbienteUrlInvocazione): UrlInvocazioneConfigurata[] {
    const lista = configurazioneUrlInvocazione()?.[ambiente];
    return Array.isArray(lista) ? lista.filter((item: any) => !!item?.identificativo) : [];
}

/** Etichetta configurata della URL predefinita, se presente. */
export function etichettaUrlPredefinita(): string | null {
    return configurazioneUrlInvocazione()?.etichetta_default || null;
}

/**
 * Etichetta di un identificativo per l'ambiente: per la predefinita quella configurata
 * (null se assente, il chiamante usa la propria label); null se l'identificativo non e` censito.
 */
export function etichettaUrlInvocazione(identificativo: string | null | undefined, ambiente: AmbienteUrlInvocazione): string | null {
    if (!identificativo) { return null; }
    if (identificativo === URL_INVOCAZIONE_DEFAULT) { return etichettaUrlPredefinita(); }
    return urlInvocazioneConfigurate(ambiente).find((item) => item.identificativo === identificativo)?.etichetta || null;
}
