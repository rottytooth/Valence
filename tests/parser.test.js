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
    expect(tree[0].length).toBe(2);
});

test('line count: blank line ignored', () => {
    let program = "𐆇𐆉𐆇𐅶\n\n𐅾𐅶𐆉\n𐅾";
    let tree = Valence.parser.parse(program, true);
    expect(tree[0].length).toBe(3);
}); 
// currently this breaks because the blank line generates no valid ASTs
// TO FIX: blank lines should simply be ignored

test('ast count: 3 instructions (no var or int force) -> 4 asts', () => {
    let program = "𐆇𐆉𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(4);
});

test('ast count: 4 instructions (one to_int) -> 5 asts', () => {
    let program = "𐆇𐆉𐆇𐅶";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(5);
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

// test('ast count: longer', () => {
//     let program = "𐆉𐆇𐆇𐆇𐆇𐆇𐅶𐆊";
//     let tree = Valence.parser.parse(program, false);
//     expect(tree[0].asts.length).toBe(169);
// }); // FIXME: This is a bad test that will continue to break with any small tweak to the grammar

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
    let program = "𐆋𐅾";
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
    let program = "𐆋[𐅾[𐅾𐅻]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(1);
});

test('lex: brackets force a single reading, 2', () => {
    let program = "[𐅻]𐆉[[𐅾𐆉]𐆉[𐅾𐆋]]";
    let tree = Valence.parser.parse(program, false, true);
    expect(tree[0].asts.length).toBe(1);
}); 

test('lex: roman equivalent', () => {
    let program = "AS";
    // FIXME: expand to test all by looping through lexicon
    let tree = Valence.parser.parse(program, false, true);
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
    let program = "𐆉𐅻𐅻𐆇𐆇𐅶𐆇𐆊";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});

test('each ast has line and line_marker', () => {
    let program = "𐆋𐆉";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
    for (let a = 0; a < tree[0].asts.length; a++) {
        ast = tree[0].asts[a];
        expect(ast.line).not.toBe(undefined);
        expect(ast.line.length).not.toBe(0);

        expect(ast.line_markers).not.toBe(undefined);
        expect(ast.line_markers.length).not.toBe(0);
    }
});

test('lines are correct: two signs', () => {
    let program = "𐆋𐆉";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
    for (let a = 0; a < tree[0].asts.length; a++) {
        ast = tree[0].asts[a];
        expect(['𐆋[𐆉]']).toContain(ast.line);
    }
});

test('lines are correct: three signs', () => {
    let program = "𐆋𐆇𐆉";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
    for (let a = 0; a < tree[0].asts.length; a++) {
        ast = tree[0].asts[a];
        expect(['[𐆋]𐆇[𐆉]','𐆋[𐆇[𐆉]]']).toContain(ast.line);
    }
});

// FIXME: For the moment, we are not throwing exception for this type of syntax error (which would block the creation of valid programs)

// test('bad parse_to_proglist: invalid code, 1', () => {
//     let program = "𐆋";
//     expect(() => {Valence.parser.parse(program, false);}).toThrow({name : "SyntaxError", message: "No valid reading for this use of 𐆋"});
// }); // FIXME: would be nice to not match exact wording

test('parse: syntax highlighting', () => {
    let program = "𐆋𐆇𐆉";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBe(2);
    for (let i = 0; i < tree[0].asts.length; i++) {
        ast = tree[0].asts[i];
        expect(['cceedec','cvcccvc']).toContain(ast.line_markers);
    }
});

// FIXME: For the moment, we are not throwing exception for this type of syntax error (which would block the creation of valid programs)

// test('parse_to_proglist: invalid code, 2', () => {
//     let program = "𐆇";
//     expect(() => {Valence.parser.parse(program, true);}).toThrow({name : "SyntaxError", message : "No valid reading for this use of 𐆇"});
// }); 


test('builds pseudocode', () => {
    let program = "𐆇𐆉𐅶";
    let tree = Valence.parser.parse(program);
    expect(tree.length).not.toBe(0);
    for (let i = 0; i < tree[0].asts.length; i++) {
        ast = tree[0].asts[i];
        expect(ast.reading.pseudo).not.toBe("");
    }
});

test('uses pseudo when marked', () => {
    let program = '𐆉[𐅾𐆁]';
    let tree = Valence.parser.parse(program, false, true);
    expect(tree.length).toBe(1);
    ast = tree[0].asts[0];
    expect(ast.reading.pseudo).toBe("set_label({var})");
});

test('parse: stop at too many', () => {
    let program = "𐅶𐅶𐅶𐅶𐅶𐅶𐅶\n𐅶𐅶𐅶𐅶𐅶𐅶𐅶\n𐅶𐅶\n𐅶𐅶𐅶𐅶𐅶𐅶𐅶𐅶";
    expect(() => {Valence.parser.parse(program, true);}).toThrow({name : "SyntaxError", message : "SyntaxError: This program generates too many interpretations"});
});

test('marking: if / else / end if is valid', () => {
    let program = "𐆇𐅶\n𐆊\n𐅾";
    let tree = Valence.parser.parse(program, true);
    expect(tree.length).toBe(2);
    expect(!Object.hasOwn(tree[0],"failed") || tree[0].failed === false).toBe(true);
    expect(!Object.hasOwn(tree[1],"failed") || tree[0].failed === false).toBe(true);
});

test('marking: good if / bad if', () => {
    let program = "𐆇𐅶\n𐆇𐅶\n𐅾";
    let tree = Valence.parser.parse(program, true);
    expect(tree.length).toBe(4);
    expect(tree[0].failed === true).toBe(true);
    expect(tree[0].failed === true).toBe(true);
    expect(tree[0].failed === true).toBe(true);
    expect(tree[0].failed === true).toBe(true);
});

test('parse: long line, no brackets', () => {
    let program = "𐆋𐆉𐅻𐆉𐅻𐅻𐆇𐆇𐅶𐅻𐆇𐆇";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});

test('parse: correct set of asts', () => {
    let program = "𐆋𐅻𐆉𐆊";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).toBeGreaterThan(4);
}); // FIXME: test here for the char interpretation

test('parse: double peaked expression', () => {
    let program = "𐆋𐅻𐆉𐅶[[[𐆇𐆉]𐅶[𐆇𐆇]]𐆇[𐅾𐆊]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});

test('parse_brackets_and_id_nodes: bug fix for lines that start with bracket', () => {
    let program = "[[[𐅻]𐆋[𐆁]]𐆁[𐆉]]𐅻[𐆇[𐆉]]";
    let tree = Valence.parser.parse(program, false);
    expect(tree[0].asts.length).not.toBe(0);
});
