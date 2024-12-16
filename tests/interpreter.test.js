if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');
Valence.interpreter = require('../valence.interpreter');

beforeEach(() => jest.resetAllMocks());

test('parse_to_proglist completes', () => {
    let program = "𐆇𐆉𐅶";
    let tree = Valence.interpreter.parse_to_proglist(program);
});

test('parse_to_proglist completes: invalid code', () => {
    let program = "𐆇";
    let tree = Valence.interpreter.parse_to_proglist(program);
    expect(tree.length).toBe(0);
});