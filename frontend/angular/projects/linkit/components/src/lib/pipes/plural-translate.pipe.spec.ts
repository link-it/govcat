import { PluralTranslatePipe } from './plural-translate.pipe';

describe('PluralTranslatePipe', () => {
    let pipe: PluralTranslatePipe;

    beforeEach(() => {
        pipe = new PluralTranslatePipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return key.none when number is 0', () => {
        const key = 'item';
        const number = 0;
        expect(pipe.transform(key, number)).toEqual('item.none');
    });

    it('should return key.singular when number is 1', () => {
        const key = 'item';
        const number = 1;
        expect(pipe.transform(key, number)).toEqual('item.singular');
    });

    it('should return key.plural when number is greater than 1', () => {
        const key = 'item';
        const number = 2;
        expect(pipe.transform(key, number)).toEqual('item.plural');
    });
});
