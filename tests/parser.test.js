if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');

beforeEach(() => jest.resetAllMocks());

test('lines count: single line', () => {
    let program = "𐆇𐆉𐆇𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree.length).toBe(1);
});

test('lines count: multiple lines', () => {
    let program = "𐆇𐆉𐆇𐅶\n𐅾𐅶𐆉";
    let tree = Valence.parser.parse(program, true);
    expect(tree.length).toBe(2);
});

test('line count: blank line counted', () => {
    let program = "𐆇𐆉𐆇𐅶\n\n𐅾𐅶𐆉";
    let tree = Valence.parser.parse(program, true);
    expect(tree.length).toBe(3);
});

test('ast count: blank line has no ast', () => {
    let program = "𐆇𐆉𐆇𐅶\n\n𐅾𐅶𐆉";
    let tree = Valence.parser.parse(program, true);
    expect(tree[0].asts.length).not.toBeLessThan(1);
    expect(tree[1].asts.length).toBe(0);
    expect(tree[2].asts.length).not.toBeLessThan(1);
});

test('ast count: 3 instructions (no var or int force) -> 4 asts', () => {
    let program = "𐆇𐆉𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(4);
});

test('ast count: 4 instructions (one to_int) -> 4 asts', () => {
    let program = "𐆇𐆉𐆇𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(4);
});

test('ast: all interpretations are unique', () => {
    let program = "𐆇𐆉𐆇𐅶𐅶";
    let tree = Valence.parser.parse(program, false);

    let unique = tree[0].asts.filter((value, index, self) => {
        return self.findIndex(v => Valence.parser.print_ast_detail(v) === Valence.parser.print_ast_detail(value)) === index;
    });

    expect(tree[0].asts.length).toBe(unique.length);
});

test('parse: range identifier resolves', () => {
    let program = "𐆇𐆉𐆇𐅶";
    let tree = Valence.parser.parse(program, false);

    let unique = tree[0].asts.filter((value, index, self) => {
        return self.findIndex(v => Valence.parser.print_ast_detail(v) === Valence.parser.print_ast_detail(value)) === index;
    });

    expect(tree[0].asts.length).toBe(unique.length);
});

test('ast: all interpretations are unique, longer example', () => {
    let program = "𐅶𐆇𐅾𐆊𐆁𐆋𐆉𐅻";
    let tree = Valence.parser.parse(program, false);

    let unique = tree[0].asts.filter((value, index, self) => {
        return self.findIndex(v => Valence.parser.print_ast_detail(v) === Valence.parser.print_ast_detail(value)) === index;
    });

    expect(tree[0].asts.length).toBe(unique.length);
});

test('ast count: 3 instructions -> 4 asts, alternate', () => {
    let program = "𐅻𐆊𐆁";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(4);
});

test('int: end node is both var and digit', () => {
    let program = "𐆇𐆉";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
    expect(tree[0].asts[0].params[0].reading.type).toBe("var");
    expect(tree[0].asts[1].params[0].reading.type).toBe("digit");
});

test('int: end node is only var', () => {
    let program = "𐅾[𐅾𐆉]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
    expect(tree[0].asts[0].params[0].params[0].reading.type).toBe("var");
});

test('int: first node is cmd', () => {
    let program = "𐅾𐅻";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
    expect(tree[0].asts[0].reading.type).toBe("cmd");
    expect(tree[0].asts[0].params[0].reading.type).not.toBe("cmd");
    expect(tree[0].asts[1].reading.type).toBe("cmd");
    expect(tree[0].asts[1].params[0].reading.type).not.toBe("cmd");
});

test('int: first node is cmd, example 2', () => {
    let program = "𐅻𐅾";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
    expect(tree[0].asts[0].reading.type).toBe("cmd");
    expect(tree[0].asts[0].params[0].reading.type).not.toBe("cmd");
    expect(tree[0].asts[1].reading.type).toBe("cmd");
    expect(tree[0].asts[1].params[0].reading.type).not.toBe("cmd");
});

test('lex: first node matches name (one example)', () => {
    let program = "𐅾𐅻";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
    expect(tree[0].asts[0].reading.name).toBe("goto");
    expect(tree[0].asts[1].reading.name).toBe("goto");
});

test('lex: brackets force a single reading', () => {
    let program = "𐅾[𐅾𐅻]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
});

test('lex: brackets force a single reading, longer', () => {
    let program = "𐆋[𐆋[𐆋[𐆋[𐅾[𐅾𐅻]]]]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
});

test('lex: brackets force a single reading', () => {
    let program = "[𐅻]𐆋[[𐅾𐆉]𐆋[𐅾𐆋]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
}); // 𐅾𐆉 seems to fail and 𐆉 alone leads to two readings

test('lex: roman equivalent', () => {
    let program = "AS";
    // FIXME: expand to test all by looping through lexicon
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
});

test('lex: command with no params', () => {
    let program = "𐅾";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
}); // NOTE: This is needed for closing bracket

test('parse: label with name', () => {
    let program = "𐆉𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
    expect(tree[0].asts[0].reading.name).toBe('label');
    expect(tree[0].asts[0].params[0].reading.name).toBe('Q');
});

test('parse: multiple peaks, all brackets', () => {
    let program = "[𐆋]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐆇𐆊]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});

test('parse: multiple peaks, no brackets', () => {
    let program = "𐆋𐆉𐅻𐅻𐆇𐆇𐅶𐆇𐆊";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});
