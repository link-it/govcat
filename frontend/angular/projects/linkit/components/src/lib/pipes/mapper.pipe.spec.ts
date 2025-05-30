import { MapperPipe } from './mapper.pipe';

describe('MapperPipe', () => {
    let pipe: MapperPipe;

    beforeEach(() => {
        pipe = new MapperPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should map the value using the provided mapper function', () => {
        const value = 'Hello world';
        const mapper = (item: string) => item.toUpperCase();
        expect(pipe.transform(value, mapper)).toEqual('HELLO WORLD');
    });

    it('should pass additional arguments to the mapper function', () => {
        const value = 'Hello';
        const mapper = (item: string, suffix: string) => item + suffix;
        expect(pipe.transform(value, mapper, ' world')).toEqual('Hello world');
    });
});