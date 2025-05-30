import { HighlighterPipe } from './highlighter.pipe';

describe('HighlighterPipe', () => {
    let pipe: HighlighterPipe;

    beforeEach(() => {
        pipe = new HighlighterPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return the original value when no args are provided', () => {
        const value = 'Hello world';
        expect(pipe.transform(value, null, 'full')).toEqual(value);
    });

    it('should highlight the full word when type is "full"', () => {
        const value = 'Hello world';
        const args = 'world';
        const expectedValue = 'Hello <span class="highlighted-text">world</span>';
        expect(pipe.transform(value, args, 'full')).toEqual(expectedValue);
    });

    it('should highlight the partial word when type is not "full"', () => {
        const value = 'Hello world';
        const args = 'o';
        const expectedValue = 'Hell<span class="highlighted-text">o</span> w<span class="highlighted-text">o</span>rld';
        expect(pipe.transform(value, args, 'partial')).toEqual(expectedValue);
    });
});