import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'propertyFilter',
  pure: false
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
