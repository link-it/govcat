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
import { Observable, of } from 'rxjs';

import { Tools } from '@linkit/components';
import { OpenAPIService } from '../services/openAPI.service';

/**
 * Configurazione remota per i guard: al primo caricamento della pagina il layout non l'ha ancora
 * caricata, quindi la si richiede senza attendere il layout (che resta l'unico a valorizzare `Tools.Configurazione`).
 */
export function configurazioneRemota$(apiService: OpenAPIService): Observable<any> {
  return Tools.Configurazione ? of(Tools.Configurazione) : apiService.getList('configurazione');
}
