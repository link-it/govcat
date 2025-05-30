import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'thousandSuff',
    standalone: false
})
export class ThousandSuffixesPipe implements PipeTransform {

  transform(input: any, args?: any): any {
    var exp, suffixes = ['k', 'M', 'G', 'T', 'P', 'E'];

    if (isNaN(Number(input))) {
      return null;
    }

    if (input < 1000) {
      return input;
    }

    exp = Math.floor(Math.log(input) / Math.log(1000));

    return (input / Math.pow(1000, exp)).toFixed(args) + suffixes[exp - 1];
  }
}
