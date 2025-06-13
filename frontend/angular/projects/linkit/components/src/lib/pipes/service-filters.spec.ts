import { PropertyFilterPipe } from "./service-filters";

describe('PropertyFilterPipe', () => {
  let pipe: PropertyFilterPipe;

  beforeEach(() => {
    pipe = new PropertyFilterPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return items if no property or value is provided', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    expect(pipe.transform(items, '', '')).toEqual(items);
  });

  it('should filter items based on property and value', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    const expectedItems = [{ name: 'John' }];
    expect(pipe.transform(items, 'name', 'John')).toEqual(expectedItems);
  });

  it('should be case insensitive', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    const expectedItems = [{ name: 'John' }];
    expect(pipe.transform(items, 'name', 'JOHN')).toEqual(expectedItems);
  });
});