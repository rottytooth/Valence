if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.scanner = require('../valence.scanner').scanner;
Valence.syntaxError = require('../valence.scanner').SyntaxError;
Valence.internalError = require('../valence.scanner').InternalError;

test('bracket matching: correctly matched', () => {
    let program = "𐆇[[𐆉𐆇]𐅶]";
    Valence.scanner.evaluate_line(program, false);
});

test('bracket matching: incorrectly matched', () => {
    let program = "𐆇[𐆉[𐆇𐅶";
    expect(() => {
        Valence.scanner.evaluate_line(program, false);
    }).toThrow(Valence.syntaxError);
});

test('remove invalid chars', () => {
    let program = "𐆇apokfda𐆉𐆇asd𐅶";
    let cleaned = Valence.scanner.remove_non_valence_chars(program);
    expect(cleaned).toBe("𐆇𐆉𐆇𐅶");
});

test('remove invalid chars', () => {
    let program = "lkghg";
    let cleaned = Valence.scanner.remove_non_valence_chars(program);
    expect(cleaned).toBe("");
});