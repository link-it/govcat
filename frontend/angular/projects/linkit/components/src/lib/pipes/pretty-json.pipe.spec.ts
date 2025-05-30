import { PrettyjsonPipe } from './pretty-json.pipe';

describe('PrettyjsonPipe', () => {
    let pipe: PrettyjsonPipe;

    beforeEach(() => {
        pipe = new PrettyjsonPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return pretty JSON', () => {
        const value = { name: 'John', age: 30 };
        const expectedValue = '{<br/>&nbsp;&nbsp;"name":&nbsp;"John",<br/>&nbsp;&nbsp;"age":&nbsp;30<br/>}';
        expect(pipe.transform(value)).toEqual(expectedValue);
    });
});
