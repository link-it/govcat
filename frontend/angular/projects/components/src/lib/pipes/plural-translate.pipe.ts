import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluralTranslate',
  pure: false
})
export class PluralTranslatePipe implements PipeTransform {

  transform(key: string, number: number): string {

    return `${key}.${number == 0 ? 'none' : number == 1 ? 'singular' : 'plural'}`;
  }
}
