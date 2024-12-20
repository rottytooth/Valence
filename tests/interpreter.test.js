if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');
Valence.interpreter = require('../valence.interpreter');

beforeEach(() => jest.resetAllMocks());

test('parse_to_proglist completes', () => {
    let program = "𐆇𐆉𐅶";
    Valence.interpreter.parse_to_proglist(program);
});

test('parse_to_proglist completes: invalid code', () => {
    let program = "𐆇";
    let tree = Valence.interpreter.parse_to_proglist(program);
    expect(tree.length).toBe(0);
});


test('builds pseudocode', () => {
    let program = "𐆇𐆉𐅶";
    let tree = Valence.interpreter.parse(program);
    expect(tree.length).not.toBe(0);
    for (let i = 0; i < tree[0].asts.length; i++) {
        ast = tree[0].asts[i];
        expect(ast.reading.pseudo).not.toBe("");
    }
});

test('uses pseudo when marked', () => {
    let program = '𐆉[𐆊[𐅾𐆁]]';
    let tree = Valence.interpreter.parse(program);
    expect(tree.length).toBe(1);
    ast = tree[0].asts[0];
    expect(ast.reading.pseudo).toBe("set_label((𐆁 > 0))");
});

test('parse: stop at too many', () => {
    let program = "𐅶𐅶𐅶𐅶𐅶𐅶𐅶\n𐅶𐅶𐅶𐅶𐅶𐅶𐅶\n𐅶𐅶\n𐅶𐅶𐅶𐅶𐅶𐅶𐅶𐅶";
    expect(Valence.interpreter.parse_to_proglist(program, true)).toThrow(Error);
});

test('marking: if / else / end if is valid', () => {
    let program = "𐆇𐅶\n𐆊\n𐅾";
    let tree = Valence.interpreter.parse_to_proglist(program);
    expect(tree.length).toBe(2);
    expect(!Object.hasOwn(tree[0],"failed") || tree[0].failed === false).toBe(true);
    expect(!Object.hasOwn(tree[1],"failed") || tree[0].failed === false).toBe(true);
});