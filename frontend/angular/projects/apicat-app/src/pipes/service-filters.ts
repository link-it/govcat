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
import { Pipe, PipeTransform } from '@angular/core';
// import { SceltaTipoAllegatiPerRuolo } from '../elements/nav-bar/toolbar-actions';

@Pipe({
  name: 'serviceGroupFilter',
  pure: false,
  standalone: false
})
export class ServiceGroupFilterPipe implements PipeTransform {
  transform(items: any[], _value: string, dictionary: any, stato: string): any {
    if (!items) {
      return items;
    }
    const value: string = (_value || '').toLowerCase();
    return items.filter(g => {
      g.servizi = dictionary[g.idGruppo].filter((se: any) => {
        return (se.idServizio.toLowerCase().indexOf(value) !== -1 || se.descrizione.toLowerCase().indexOf(value) !== -1);
      }).filter((se: any) => {
        return (!stato || se.stato === stato);
      });
      return (g.idGruppo.toLowerCase().indexOf(value) !== -1 || g.servizi.length !== 0);
    });
  }
}

@Pipe({
  name: 'serviceFilter',
  pure: false,
  standalone: false
})
export class ServiceFilterPipe implements PipeTransform {
  transform(items: any[], _value: string): any {
    if (!items || !_value) {
      return items;
    }
    const value: string = _value.toLowerCase();
    return items.filter(se => {
      return (se.idGruppo.toLowerCase().indexOf(value) !== -1 || se.nome.toLowerCase().indexOf(value) !== -1 || se.descrizione.toLowerCase().indexOf(value) !== -1);
    });
  }
}

@Pipe({
  name: 'groupFilter',
  pure: false,
  standalone: false
})
export class GroupFilterPipe implements PipeTransform {
  transform(items: any[], _value: string, _all: boolean = false): any {
    if (!items) {
      return items;
    }
    const value: string = (_value || '').toLowerCase();
    return items.filter(g => {
      const bool: boolean = (g.idGruppo.toLowerCase().indexOf(value) !== -1 || g.search.some((s: any) => s.indexOf(value) !== -1));
      return _all?(bool && (g.isServizio || g.isDominio || g.isAdesione)):(bool);
    });
  }
}

@Pipe({
  name: 'dominiFilterList',
  pure: false,
  standalone: false
})
export class DominiFilterListPipe implements PipeTransform {
  transform(items: any[], _value: string): any {
    if (!items || !_value) {
      return items;
    }
    const value: string = _value.toLowerCase();
    return items.filter(d => {
      return (d.idGruppo.toLowerCase().indexOf(value) !== -1 || d.descrizione.toLowerCase().indexOf(value) !== -1 || d.search.some((s: any) => s.indexOf(value) !== -1));
    });
  }
}



@Pipe({
  name: 'propertyFilter',
  pure: false,
  standalone: false
})
export class PropertyFilterPipe implements PipeTransform {
  transform(items: any[], _property: string, _value: string): any {
    if (!items || !_property || !_value) {
      return items;
    }
    const value: string = _value.toLowerCase();
    return items.filter(el => {
      return (el[_property].toLowerCase().indexOf(value) !== -1);
    });
  }
}

@Pipe({
  name: 'risorseFilter',
  pure: false,
  standalone: false
})
export class RisorseFilterPipe implements PipeTransform {
  transform(items: any[], values: any[]): any {
    if (!items || !values) {
      return (items || []);
    }
    return items.filter((el: string) => {
      return (values.indexOf(el) === -1 && values.indexOf('*') === -1);
    });
  }
}

@Pipe({
  name: 'authFilter',
  pure: false,
  standalone: false
})
export class AuthFilterPipe implements PipeTransform {
  transform(items: any[], values: any[]): any {
    if (!items || !values) {
      return (items || []);
    }
    return items.filter((el: any) => {
      return (values.filter((o: any) => el.codice_interno === o.code).length === 0);
    });
  }
}

// @Pipe({
//   name: 'vibilitaAllegatiPerRuolo',
//   pure: false
// })
// export class VisibilitaAllegatiPerRuoloPipe implements PipeTransform {
//   transform(items: any[]): any {
//     if (!items) {
//       return [];
//     }
//     return items.filter((type: any) => {
//       return SceltaTipoAllegatiPerRuolo(type.value);
//     });
//   }
// }
