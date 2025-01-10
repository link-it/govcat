import { Pipe, PipeTransform } from '@angular/core';

type Mapper<T, G> = (item: T, ...args: any[]) => G;

@Pipe({
  name: `mapper`
})
export class MapperPipe implements PipeTransform {
  /**
   * Maps object to an arbitrary result through a mapper function
   *
   * @param value an item to transform
   * @param mapper a mapping function
   * @param args arbitrary number of additional arguments
   */
  transform<T, G>(value: T, mapper: Mapper<T, G>, ...args: any[]): G {
    return mapper(value, ...args);
  }
}
