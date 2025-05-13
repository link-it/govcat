import { ThousandSuffixesPipe } from './thousand-suff.pipe';

describe('ThousandSuffixesPipe', () => {
  let pipe: ThousandSuffixesPipe;

  beforeEach(() => {
    pipe = new ThousandSuffixesPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null if input is NaN', () => {
    expect(pipe.transform('not a number')).toBeNull();
  });

  it('should return input if input is less than 1000', () => {
    expect(pipe.transform(500)).toEqual(500);
  });

  it('should return input with thousand suffix', () => {
    expect(pipe.transform(1500, 1)).toEqual('1.5k');
    expect(pipe.transform(1500000, 1)).toEqual('1.5M');
  });
});