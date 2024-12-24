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
