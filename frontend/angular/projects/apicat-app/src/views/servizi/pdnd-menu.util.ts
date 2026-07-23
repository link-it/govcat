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

/**
 * Logica condivisa (Gestione API + vetrina) per il menù PDND, guidata dalla
 * configurazione: profili con `pdnd_type` e lista `pdnd_types` con le
 * `required_proprieta_custom`.
 */

interface PdndRequiredProperty {
  nome_gruppo: string;
  nome_proprieta: string;
}

/** Vero se almeno un profilo dell'API ha una `pdnd_type` configurata. */
export function apiHasPdndProfile(api: any, profili: any[]): boolean {
  const _groups = api?.gruppi_auth_type || [];
  return _groups.some((auth: any) => {
    const _profile = profili?.find((item: any) => item.codice_interno === auth.profilo);
    return !!_profile?.pdnd_type;
  });
}

/**
 * Vero se la proprietà richiesta (`{nome_gruppo, nome_proprieta}`) è presente e
 * valorizzata nelle `proprieta_custom` dell'API. Il match sul gruppo accetta sia
 * il nome esatto sia le varianti con suffisso (es. `PDNDProduzione_identificativo`).
 */
export function isPdndRequiredPropertyValued(api: any, req: PdndRequiredProperty): boolean {
  const _groups = api?.proprieta_custom || [];
  const _group = _groups.find((item: any) =>
    item.gruppo === req.nome_gruppo || item.gruppo?.startsWith(req.nome_gruppo + '_'));
  if (!_group) {
    return false;
  }
  const _property = (_group.proprieta || []).find((p: any) => p.nome === req.nome_proprieta);
  return !!_property?.valore;
}

/**
 * Vero se l'API è "configurata correttamente" per la PDND: almeno un profilo con
 * `pdnd_type` risolto in `pdndTypes` ha soddisfatto le `required_proprieta_custom`
 * (semantica OR: basta che una sia valorizzata). `pdnd_type` non risolto -> false;
 * lista requisiti vuota -> true.
 */
export function isApiPdndConfigured(api: any, profili: any[], pdndTypes: any[]): boolean {
  const _groups = api?.gruppi_auth_type || [];
  return _groups.some((auth: any) => {
    const _profile = profili?.find((item: any) => item.codice_interno === auth.profilo);
    if (!_profile?.pdnd_type) {
      return false;
    }
    const _pdndType = pdndTypes?.find((t: any) => t.identificativo === _profile.pdnd_type);
    if (!_pdndType) {
      return false;
    }
    const _required = _pdndType.required_proprieta_custom || [];
    if (!_required.length) {
      return true;
    }
    return _required.some((req: PdndRequiredProperty) => isPdndRequiredPropertyValued(api, req));
  });
}

/** Vero se il soggetto referente del dominio è presente nella config PDND. */
export function isSoggettoInPdndConfig(soggettoNome: string | null | undefined, pdndList: any[] | null): boolean {
  if (!soggettoNome || !pdndList) {
    return false;
  }
  return pdndList.findIndex((item: any) => item.nome_soggetto === soggettoNome) !== -1;
}

/** Producer id (collaudo/produzione) del soggetto nella config PDND, o `null`. */
export function getPdndProducerIds(soggettoNome: string, pdndList: any[]): { producerIdCollaudo: string; producerIdProduzione: string } | null {
  const _index = pdndList?.findIndex((item: any) => item.nome_soggetto === soggettoNome) ?? -1;
  if (_index === -1) {
    return null;
  }
  const _pdnd = pdndList[_index];
  return {
    producerIdCollaudo: _pdnd.collaudo?.id_producer,
    producerIdProduzione: _pdnd.produzione?.id_producer
  };
}
