jest.setTimeout(5 * 1000);

if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');
Valence.interpreter = require('../valence.interpreter');

beforeEach(() => jest.restoreAllMocks());

test('run(): completes', async () => {
    let program = "𐆇𐆉𐅶";
    await Valence.interpreter.run(program);
});

test('run(): synchronous call', () => {
    let program = "𐆇𐆉𐅶";
    Valence.interpreter.run(program, true);
});

test('run(): launches only successful builds', async () => {
    let program = "𐆇𐆉𐅶";
    await Valence.interpreter.run(program).then(data => {
        expect(data.length).toBe(2);
    });
});

test('run(): two-line program', async () => {
    let program = "𐆇𐆉[𐅾𐅶]\n𐅾𐆋";
    await Valence.interpreter.run(program).then(data => {
        expect(data.length).toBe(2);
    });
});

test('run(): launch_interpreter called twice', async () => {
    let program = "[𐆇]𐆉𐅶";
    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let called = [];

    const callback = (id, ln, state) => {
        if (!called.includes(id)) {
            called.push(id);
        }
    };
    
    await Valence.interpreter.launch_all(progs, callback, 0).then(d =>{
        expect(called.length).toBe(2);
    });
});

test('label: assigned at start of program', async () => {
    let program = `𐅾[𐅾𐅻]
[𐅶]𐅶[𐆇𐆋]
𐆉𐅻`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    const callback = (id, ln, state) => {
        expect(state[0].value).toBe(0); // second line assignment should be skipped, leaving this 0
        expect(state[5].value).toBe(2); // label has been assigned its line number
    };

    await Valence.interpreter.launch_all(progs, callback, 0);
});

test('label: all', async () => {
    let program = `𐆉𐅻
𐆉𐆊
𐆉𐆁
𐆉𐆊
𐆉𐆉
𐆉𐆁
𐆉𐅾
𐆉𐆋
𐆉𐆉
𐆉𐅶
𐆉𐆇`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));
    let final_state = [];
    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0].value).toBe(9);
    expect(final_state[1].value).toBe(10);
    expect(final_state[2].value).toBe(6);
    expect(final_state[3].value).toBe(7);
    expect(final_state[4].value).toBe(8);
    expect(final_state[5].value).toBe(0);
    expect(final_state[6].value).toBe(3);
    expect(final_state[7].value).toBe(5);
});

// runs each reading of the program, returning the lines visited by each
const run_lines = async (program) => {
    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let lines = progs.map(() => []);

    const callback = (id, ln, state) => {
        if (ln == -1) return;
        lines[id].push(ln);
    };

    await Valence.interpreter.launch_all(progs, callback, 0);
    return lines;
}

test('line order: label, goto', async () => {
    let program = `𐅾[𐆇𐆋]
𐆉𐆉
𐅾[𐆇𐅻]
𐆉𐆋
𐅾[𐅾𐆉]
𐆉𐅻`;

    /*
    goto(3)
    set_label(S)
    goto(5)
    set_label(A)
    goto(S)
    set_label(D)
    */

    expect(await run_lines(program)).toStrictEqual([[0, 3, 4, 1, 2, 5]]);
});

test('goto: variable goes to the line it holds, digit goes to where its label is written', async () => {
    let program = `[𐆉]𐆉[𐆇𐆊]
𐅾[𐆉]
[𐅶]𐅶[𐆇𐆇]
𐆉𐆉
[𐆇]𐅶[𐆇𐆇]
[𐅾]𐅶[𐆇𐆇]
[𐆋]𐅶[𐆇𐆇]`;

    /*
    S = 6
    goto(S) | goto(4)
    Q += 1
    set_label(S)
    W += 1
    E += 1
    A += 1
    */

    expect(await run_lines(program)).toStrictEqual([[0, 1, 6], [0, 1, 3, 4, 5, 6]]);
});

test('goto: expressions go to the label of the var they resolve to', async () => {
    let program = `𐅾[[𐅾𐆉]𐅶[𐆇𐆇]]
[𐅶]𐅶[𐆇𐆇]
𐆉𐅻
[𐆇]𐅶[𐆇𐆇]
𐆉𐆉`;

    /*
    goto(S + 1)
    Q += 1
    set_label(D)
    W += 1
    set_label(S)
    */

    // S is labeled at line 4, so S + 1 = 5 goes to the label of D
    expect(await run_lines(program)).toStrictEqual([[0, 2, 3, 4]]);
});

test('goto: closest label, forward or back', async () => {
    let program = `𐅾[𐆇𐆋]
𐆉𐆉
𐅾[𐆇𐆊]
𐆉𐆋
𐅾[𐆇𐆉]
𐆉𐆉
𐆉𐆋
𐆉𐆊`;

    /*
    goto(3)
    set_label(S)
    goto(6)
    set_label(A)
    goto(4)
    set_label(S)
    set_label(A)
    set_label(Z)
    */

    // goto(3) from line 0: A is labeled at 3 and 6, 3 is closer
    // goto(4) from line 4: S is labeled at 1 and 5, 5 is closer
    expect(await run_lines(program)).toStrictEqual([[0, 3, 4, 5, 6, 7]]);
});

test('goto: on a tie between labels, goes back', async () => {
    let program = `𐅾[𐆇𐆊]
𐆉𐆉
𐅾[𐆇𐆁]
[𐅶]𐅶[𐆇𐆇]
𐆉𐆊
𐅾[𐆇𐆉]
[𐅶]𐅶[𐆇𐆇]
𐆉𐆁
[𐅶]𐅶[𐆇𐆇]
𐆉𐆉`;

    /*
    goto(6)
    set_label(S)
    goto(7)
    Q += 1
    set_label(Z)
    goto(4)
    Q += 1
    set_label(X)
    Q += 1
    set_label(S)
    */

    // goto(4) from line 5: S is labeled at 1 and 9, both 4 lines away
    expect(await run_lines(program)).toStrictEqual([[0, 4, 5, 1, 2, 7, 8, 9]]);
});

test('label: pre-processor directive, does nothing when reached', async () => {
    let program = `[𐆉]𐆉[𐆇𐅻]
𐆉𐆉`;

    /*
    S = 5
    set_label(S)
    */

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));
    let final_states = [];
    const callback = (id, ln, state) => {
        final_states[id] = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    // S was set to 1 by its label before the program ran, then to 5, and reaching the label leaves it 5
    expect(final_states.length).toBeGreaterThan(0);
    final_states.forEach(state => expect(state[4].value).toBe(5));
});

test('goto: no label for the var continues to the next line', async () => {
    let program = `𐅾[𐆇𐆋]
[𐅶]𐅶[𐆇𐆇]`;

    /*
    goto(3)
    Q += 1
    */

    expect(await run_lines(program)).toStrictEqual([[0, 1]]);
});

test('goto: values round to the closest int and wrap to a var', async () => {
    const labels = `
𐆉𐅾
𐆉𐆋
𐆉𐆉`;

    // 5 / 2 = 2.5, rounded to 3 (A)
    expect(await run_lines(`𐅾[[𐆇𐅻]𐅾[𐆇𐅾]]` + labels)).toStrictEqual([[0, 2, 3]]);

    // ratio 7/2 = 3.5, rounded to 4 (S)
    expect(await run_lines(`𐅾[[[𐆁]𐆉[𐆇𐆁]]𐅾[𐆇𐅾]]` + labels)).toStrictEqual([[0, 3]]);

    // ratio 7/3 = 2.33, rounded to 2 (E)
    expect(await run_lines(`𐅾[[[𐆁]𐆉[𐆇𐆁]]𐅾[𐆇𐆋]]` + labels)).toStrictEqual([[0, 1, 2, 3]]);

    // 5 + 5 = 10, wraps to 2 (E)
    expect(await run_lines(`𐅾[[𐆇𐅻]𐅶[𐆇𐅻]]` + labels)).toStrictEqual([[0, 1, 2, 3]]);

    // 0 - 3 = -3, wraps to 3 (A)
    expect(await run_lines(`𐅾[[𐆇𐅶]𐆇[𐆇𐆋]]` + labels)).toStrictEqual([[0, 2, 3]]);
});

test('goto: variable holding a ratio rounds to the closest line', async () => {
    let program = `[𐆉]𐆉[[[𐆁]𐆉[𐆇𐆁]]𐅾[𐆇𐅾]]
𐅾[𐅾𐆉]
[𐅶]𐅶[𐆇𐆇]
[𐅶]𐅶[𐆇𐆇]
[𐆇]𐅶[𐆇𐆇]`;

    /*
    S = cast(ratio, 7) / 2
    goto(S)
    Q += 1
    Q += 1
    W += 1
    */

    // S = 3.5, rounded to 4
    expect(await run_lines(program)).toStrictEqual([[0, 1, 4]]);
});

test('goto: non-int values are cast to int', async () => {
    // cast(bool, 3) = true, cast to 1 (W)
    expect(await run_lines(`𐅾[[𐆊]𐆉[𐆇𐆋]]
𐆉𐅾
𐆉𐆇`)).toStrictEqual([[0, 2]]);
});


test('state: assignment and addition', async () => {
    let program = `[𐆇]𐅶[𐆇[𐅶]]
𐆋[𐅾[𐆇]]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]
𐆋[𐅾[𐅾𐆇]]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]
𐆋[𐅾[𐆇]]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]`;

/*
    𐆇 = (𐆇 + 0)
    print(𐆇);
    let 𐅻 = (𐆇);
    𐆇 = (𐆇 + 1)
    print(𐆇);
    let 𐅻 = (𐆇);
    𐆇 = (𐆇 + 1)
    print(𐆇);
    let 𐅻 = (𐆇);
    𐆇 = (𐆇 + 1)
*/

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    // test final_state    
    expect(final_state[1].value).toBe(4); //  𐆇 should be 4
    expect(final_state[5].value).toBe(3); //  𐅻 should be 3
});

test('print', async () => {
    let program = `[𐆇]𐅶[𐆇[𐅶]]
𐆋[𐅾[𐆇]]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]
𐆋[𐅾𐆇]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]
𐆋[𐅾[𐆇]]
[𐅻]𐆉[𐅾𐆇]
[𐆇]𐅶[𐆇[𐆇]]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print.value;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    // test final_state    
    expect(output).toBe("123");
});

test('print: on first line', async () => {
    let program = '𐆋[𐅾𐆉]';

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print.value;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    // test final_state    
    expect(output).toBe("4");
});

test('print: after value updated', async () => {
    let program = `𐆋[𐅾𐆉]
[𐆉]𐅶[𐅾𐆁]
𐆋[𐆇𐆉]
𐆋[𐅾𐆉]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print.value;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    // test final_state    
    expect(output).toBe("4411");

});

test('alt progs: two with while loop', async () => {
    let program = `𐅶[𐅶[[𐅾[𐅶]]𐆇[[𐅻[𐆇[𐆇]]]𐅶[𐆇[𐆋]]]]]
[𐅶]𐅶𐅾
[𐅾]𐅶[𐆇𐆇]
𐆋[𐅾𐅶]
𐅾`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = ["",""];
    Valence.interpreter.print_callback = (id, print) => {
        output[id] += print.value;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    expect(output[0]).toBe("25914"); // counts in 3s from 2
    expect(output[1]).toBe("24681012"); // counts in 2s

}); // FIXME: Waiting on Bool implementation

test('hello world', async () => {
    let program = `[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐆇]]]]
[𐅶]𐆉[𐅾𐆋]
[𐆋]𐅶[[𐅻[𐆇𐆋]]𐅶[𐆇𐅻]]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆁]
[𐅶]𐅻[𐅾𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐅾𐆉]𐆉[𐅻[𐆇𐆉]]
[𐅶]𐅶[𐅾𐆉]
[𐆁]𐆉[[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐅾]]]𐅶[𐆇𐆁]]
[𐅶]𐅻[𐅾𐆁]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐅶[𐆇[𐆊]]]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐅶[𐅻[𐆇𐆇]]]
[𐅶]𐅻[𐅾𐆋]
𐆋[𐅾𐅶]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let called_print = false;

    Valence.interpreter.print_callback = {};
    Valence.interpreter.print_callback = (id, print) => {
        expect(print.value).toBe("Hello World");
        called_print = true;
    };

    await Valence.interpreter.launch_all(progs, false, 0);
    expect(called_print).toBe(true);
});

test('calc goto: two alternatives', async () => {
    let program = `[𐅶]𐆉[𐆇𐆇]
[𐆁]𐆉[𐅶]
𐅾[[𐆇𐅻]𐅶[𐅾𐆁]]
[𐆊]𐆉[𐆇𐅶]
𐆉𐅻
[𐆉]𐅶[𐆇𐅾]
𐆉𐆊
[𐆉]𐅶[𐆇𐅾]
`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [[],[]];

    const callback = (id, ln, state) => {
        final_state[id] = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0][4].value).toBe(6);
    expect(final_state[0][7].value).toBe(1);
    expect(final_state[1][4].value).toBe(8);
    expect(final_state[1][7].value).toBe(0);

});

test('if/else: basic', async () => {
    let program = `[𐅶]𐆉[𐆇𐆇]
𐆇[𐅶]
𐆋[[𐅻]𐆉[[[𐅻[𐅻[𐆇[𐆇]]]]𐅶[𐅻[𐆇[𐆇]]]]𐅶[𐆇[𐆊]]]]
𐆊
𐆋[[𐅻]𐆉[[[𐅻[𐅻[𐆇[𐆇]]]]𐅶[𐅻[𐆇[𐆋]]]]𐅶[𐆇[𐆇]]]]
𐅾
`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let n = 0;
    let y = 0;

    Valence.interpreter.print_callback = (id, print) => {
        if (print.value === 'N' || print.value === 78) {
            n++;
        }
        if (print.value === 'Y' || print.value === 89) {
            y++;
        }
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    expect(n).toBe(1);
    expect(y).toBe(1);
});

test('assign: cast to var', async () => {
    // cast(4,𐅻) = 7
    // This should cast 𐅻 to a string type, then resolve that to an int that is 𐅻 and assign it 7
    let program = `[[𐆇𐆉]𐆉[𐅾𐅻]]𐆉[𐆇𐆁]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[5].value).toBe(7);
});

test('assign: var as exp', async () => {
    // 𐆇 = 0
    // &𐆇 = 7
    let program = `[𐆇]𐆉[𐆇𐅶]
[𐅾𐆇]𐆉[𐆇𐆁]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[1].value).toBe(0);
    expect(final_state[0].value).toBe(7);
});

test('assign: var as exp, add and mult', async () => {
    let program = `[[[𐅾𐆇]𐆁[𐆇𐆋]]𐅶[𐆇𐆋]]𐆉[𐆇𐆁]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[6].value).toBe(7);
});

test('assign: var as exp, add and mult', async () => {
    // ((𐆇 * 4) + (3 + !(5))) = 7
    // This should resolve to (1 * 4) + (3 - 5), which equals 2
    let program = `[[[𐅾𐆇]𐆁[𐆇𐆉]]𐅶[[𐆇𐆋]𐅶[𐅶[𐆇𐅻]]]]𐆉[𐆇𐆁]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[2].value).toBe(7);
});

test('cast: not bool', async () => {
    let program = `[𐅶]𐆉[𐅶[[𐆊]𐆉[𐆇𐆇]]]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0].value).toBe(false);
});

test('queue: initialize int', async () => {
    // 𐅶 = cast(queue,1)
    let program = `[𐅶]𐆉[[𐆋]𐆉[𐆇𐆇]]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0].type).toBe("queue");
    expect(final_state[0].value[0].type).toBe("int");
    expect(final_state[0].value[0].value).toBe(1);
});

test('queue: mul_assign with char and int', async () => {
    // 𐅶 = cast(queue,1)
    let program = `[𐅶]𐆉[[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐆇𐆇]]]]
[𐅶]𐅻[𐆇𐆁]
[𐅶]𐆁[𐆇𐅾]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0].type).toBe("queue");
    expect(final_state[0].value[0].type).toBe("char");
    expect(final_state[0].value[0].value).toBe(130); // char 130 = ''
    expect(final_state[0].value[1].type).toBe("int");
    expect(final_state[0].value[1].value).toBe(14);
});

test('while dequeue loop', async () => {
    let program = `[𐅶]𐆉[[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐆇𐆇]]]]
[𐅶]𐅻[𐆇𐆋]
[𐅶]𐅻[𐅻[𐆇𐆊]]
[𐅶]𐆇[𐆁]
𐆋[𐅾𐆁]
𐅾`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print.toString();
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    // test final_state    
    expect(output).toBe("A348");
});

test('dequeue: simple dequeue', async () => {
    let program = `[𐅶]𐆉[[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆉]]]𐅶[𐆇𐆊]]]]
[𐅶]𐅻[𐅻[𐆇𐆊]]
[𐆉]𐆉[𐆁𐅶]`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[0].type).toBe("queue");
    expect(final_state[0].value[0].type).toBe("int");
    expect(final_state[0].value[0].value).toBe(48);
    expect(final_state[4].type).toBe("char");
    expect(final_state[4].toString()).toBe('Ć');
});

test('dequeue: on empty queue does not stop action', async () => {
    let program = `[𐅶]𐆉[[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆉]]]𐅶[𐆇𐆊]]]]
[𐆉]𐆉[𐆁𐅶]
[𐅾]𐆉[𐆁𐅶]
𐆋[𐅾𐆉]`;
/*
    𐅶 = cast(queue,cast(char,(((4*8)*8) + 6)))
    𐆉 = DEQUEUE (𐅶)
    𐅾 = DEQUEUE (𐅶)
    print(𐆉)
*/

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];
    output = "";

    const callback = (id, ln, state) => {
        final_state = state;
    };

    Valence.interpreter.print_callback = (id, print) => {
        output += print.toString();
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(output).toBe("Ć");
});
 
test('var: negative var number should get abs()', async () => {
    let program = `[𐅶[𐆇[𐆋]]]𐆉[𐆇𐆁]`; // !(3) = 7

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];

    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

    expect(final_state[3].value == 7);
});


// runs the program with the given inputs, returning the final state of each reading
const run_with_input = async (program, inputs) => {
    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_states = progs.map(() => []);
    const callback = (id, ln, state) => {
        final_states[id] = state;
    };

    Valence.interpreter.input_callback = async (id, type) => inputs.shift();
    try {
        await Valence.interpreter.launch_all(progs, callback, 0);
    } finally {
        Valence.interpreter.input_callback = false;
    }
    return final_states;
}

// converts a value to the plain form used in input_formats.json
const to_plain = (val) => {
    switch (val.type) {
        case "char":
            return String.fromCharCode(val.value);
        case "ratio":
            return `${val.value.num}/${val.value.den}`;
        case "queue":
            return val.value.map(x => ({type: x.type, value: to_plain(x)}));
        default:
            return val.value;
    }
}

const input_formats = require('../input_formats.json');
const v = require('../valence.types');

describe('input formats', () => {
    for (const [type, spec] of Object.entries(input_formats)) {
        test.each(spec.examples)(`${type}: %j`, ({input, value}) => {
            let parsed = v.parse_input(type, input);
            expect(parsed.type).toBe(type);
            expect(to_plain(parsed)).toStrictEqual(value);
        });
    }
});

test('input: converted to the given type', async () => {
    let program = '𐆉𐆋𐅶';

    /*
    S = input(int)
    */

    let [final_state] = await run_with_input(program, ["42"]);
    expect(final_state[4].type).toBe("int");
    expect(final_state[4].value).toBe(42);
});

test('input: string keeps digits as text', async () => {
    let [final_state] = await run_with_input('𐆉𐆋𐆉', ["42"]);
    expect(final_state[4].type).toBe("string");
    expect(final_state[4].value).toBe("42");
});

test('input: queue from comma-separated values', async () => {
    let [final_state] = await run_with_input('𐆉𐆋𐆋', ["1, 2, 3"]);
    expect(final_state[4].type).toBe("queue");
    expect(final_state[4].value.map(x => x.value)).toStrictEqual([1, 2, 3]);
});

test('input: type given by expression', async () => {
    let program = '𐆉𐆋[𐆇𐆁]';

    /*
    S = input(7)   → 7 is ratio
    */

    let [final_state] = await run_with_input(program, ["3/4"]);
    expect(final_state[4].type).toBe("ratio");
    expect(final_state[4].value).toStrictEqual({num: 3, den: 4});
});

test('input: type that cannot be determined keeps the var type', async () => {
    let program = '𐆉𐆋[𐆇𐆇]';

    /*
    S = input(1)   → 1 has no type; S is an int
    */

    let [final_state] = await run_with_input(program, ["12"]);
    expect(final_state[4].type).toBe("int");
    expect(final_state[4].value).toBe(12);
});

test('input: multiple inputs are read in order', async () => {
    let program = `𐆉𐆋𐆉
[𐆋]𐆋[𐅶]`;

    /*
    S = input(string)
    A = input(int)
    */

    let [final_state] = await run_with_input(program, ["first", "2"]);
    expect(final_state[4].value).toBe("first");
    expect(final_state[3].value).toBe(2);
});

test('input: var given by expression wraps to a var', async () => {
    let program = '[[𐆇𐆁]𐅶[𐆇𐆋]]𐆋[𐆉]';

    /*
    (7 + 3) = input(string)   → 10 wraps to var 2
    */

    let [final_state] = await run_with_input(program, ["wrapped"]);
    expect(final_state[2].value).toBe("wrapped");
});

test('input: null input leaves the var unchanged', async () => {
    let program = `𐆉𐆋𐅶
[𐆋]𐆉[𐆇𐆁]`;

    /*
    S = input(int)   (cancelled)
    A = 7
    */

    let [final_state] = await run_with_input(program, [null]);
    expect(final_state[4]).toStrictEqual(Valence.interpreter.initial_state()[4]);
    expect(final_state[3].value).toBe(7); // program continues after
});

test('input: no input callback leaves the var unchanged', async () => {
    let program = '𐆉𐆋𐆉';
    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let final_state = [];
    const callback = (id, ln, state) => {
        final_state = state;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);
    expect(final_state[4].value).toBe(4);
});

test('input: program id and type are passed to the callback', async () => {
    let program = '𐆉𐆋𐆁';
    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let calls = [];
    Valence.interpreter.input_callback = async (id, type) => {
        calls.push([id, type]);
        return "1/2";
    };
    try {
        await Valence.interpreter.launch_all(progs, false, 0);
    } finally {
        Valence.interpreter.input_callback = false;
    }
    expect(calls).toStrictEqual(progs.map(p => [p.id, "ratio"]));
});

test('cast: string to bool', () => {
    expect(v.Bool.cast(new v.String("true"))).toBe(true);
    expect(v.Bool.cast(new v.String(" TRUE "))).toBe(true);
    expect(v.Bool.cast(new v.String("false"))).toBe(false);
    expect(v.Bool.cast(new v.String("hello"))).toBe(false);
});

test('cast: string to ratio', () => {
    expect(v.Ratio.cast(new v.String("3/4"))).toStrictEqual({num: 3, den: 4});
    expect(v.Ratio.cast(new v.String("6 / 8"))).toStrictEqual({num: 3, den: 4});
    expect(v.Ratio.cast(new v.String("5"))).toStrictEqual({num: 5, den: 1});
    expect(v.Ratio.cast(new v.String("0.75"))).toStrictEqual({num: 3, den: 4});
    expect(v.Ratio.cast(new v.String("1/0"))).toStrictEqual({num: 0, den: 1});
    expect(v.Ratio.cast(new v.String("abc"))).toStrictEqual({num: 0, den: 1});
});

test('print: ratio prints as a fraction', async () => {
    let program = '𐆋[[[𐆁]𐆉[𐆇𐆁]]𐅾[𐆇𐅾]]';

    /*
    print(cast(ratio, 7) / 2)
    */

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    // printed the same way as the web console
    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print;
    };

    await Valence.interpreter.launch_all(progs, false, 0);
    expect(output).toBe("7/2");
});

describe('cast: from queue', () => {
    const queue = () => v.parse_input("queue", "5, 2");
    const empty = () => new v.Queue([]);

    test('int, char, ratio: the front element', () => {
        expect(v.Int.cast(queue())).toBe(5);
        expect(v.build_val_obj("char", queue()).value).toBe(5);
        expect(v.Ratio.cast(queue())).toStrictEqual({num: 5, den: 1});
    });

    test('int, char, ratio: zero when empty', () => {
        expect(v.Int.cast(empty())).toBe(0);
        expect(v.build_val_obj("char", empty()).value).toBe(0);
        expect(v.Ratio.cast(empty())).toStrictEqual({num: 0, den: 1});
    });

    test('bool: true if the queue has anything in it', () => {
        expect(v.Bool.cast(queue())).toBe(true);
        expect(v.Bool.cast(v.parse_input("queue", "0"))).toBe(true);
        expect(v.Bool.cast(empty())).toBe(false);
    });

    test('string: the whole queue, in the input format', () => {
        expect(v.String.cast(queue())).toBe("5, 2");
        expect(v.String.cast(empty())).toBe("");

        // round trip through queue input
        let text = "1, 1/2, true, hi";
        expect(v.String.cast(v.parse_input("queue", text))).toBe(text);
    });

    test('casting does not remove anything from the queue', () => {
        let q = queue();
        v.Int.cast(q);
        v.Bool.cast(q);
        v.Ratio.cast(q);
        v.String.cast(q);
        expect(q.value.length).toBe(2);
    });

});

test('cast: from char', () => {
    let c = v.parse_input("char", "a");
    expect(v.Bool.cast(c)).toBe(true);
    expect(v.Bool.cast(new v.Char(0))).toBe(false);
    expect(v.Ratio.cast(c)).toStrictEqual({num: 97, den: 1});
});

test('cast: arithmetic with a queue leaves the queue unchanged', async () => {
    let program = `𐆋𐆋𐆋
[𐆇]𐅶[𐅾𐆋]`;

    /*
    A = input(queue)
    W += A
    */

    let [final_state] = await run_with_input(program, ["5, 2"]);
    expect(final_state[1].value).toBe(6);
    expect(final_state[3].value.length).toBe(2);
});

describe('queues within queues', () => {
    const q = (...items) => new v.Queue(items);
    const i = (n) => new v.Int(n);

    // [[5, 2], 3]
    const nested = () => q(q(i(5), i(2)), i(3));

    test('append a queue to a queue nests it', () => {
        expect(q(i(1)).append(q(i(2), i(3))).toString()).toBe("[1, [2, 3]]");
    });

    test('prints and displays the nesting', () => {
        expect(nested().toString()).toBe("[[5, 2], 3]");
        expect(nested().toDisplay()).toBe("[[5, 2], 3]");
    });

    test('cast to int, char, ratio: the front element of the front element', () => {
        expect(v.Int.cast(nested())).toBe(5);
        expect(v.build_val_obj("char", nested()).value).toBe(5);
        expect(v.Ratio.cast(nested())).toStrictEqual({num: 5, den: 1});
    });

    test('cast to int, ratio: an empty queue at the front is zero', () => {
        expect(v.Int.cast(q(q(), i(3)))).toBe(0);
        expect(v.Ratio.cast(q(q(), i(3)))).toStrictEqual({num: 0, den: 1});
    });

    test('cast to bool: a queue holding an empty queue is not empty', () => {
        expect(v.Bool.cast(q(q()))).toBe(true);
    });

    test('cast to string: inner queues keep their brackets', () => {
        expect(v.String.cast(nested())).toBe("[5, 2], 3");
    });

    test('casting does not change the inner queue', () => {
        let val = nested();
        v.Int.cast(val);
        v.Ratio.cast(val);
        v.Bool.cast(val);
        v.String.cast(val);
        expect(val.toString()).toBe("[[5, 2], 3]");
    });

    test('arithmetic reaches into inner queues', () => {
        expect(nested().add(i(1)).toString()).toBe("[[6, 3], 4]");
        expect(nested().sub(i(1)).toString()).toBe("[[4, 1], 2]");
        expect(nested().mul(i(2)).toString()).toBe("[[10, 4], 6]");
    });

    test('not reaches into inner queues', () => {
        expect(nested().not().toString()).toBe("[[-5, -2], -3]");
    });

    test('adding a queue uses its front element at every level', () => {
        expect(q(q(i(1)), i(2)).add(q(i(10), i(20))).toString()).toBe("[[11], 12]");
    });

    test('while_queue gives the inner queue as one element', async () => {
        let program = `𐆋𐆋𐆋
𐆉𐆋𐆋
[𐆉]𐅻[𐅾𐆋]
[𐆉]𐆇[𐆁]
𐆋[𐅾𐆁]
𐅾`;

        /*
        A = input(queue)    "1, 2"
        S = input(queue)    "3"
        S APPEND A          → [3, [1, 2]]
        while X = dequeue(S):
            print(X)
        */

        let printed = [];
        Valence.interpreter.print_callback = (id, print) => {
            printed.push(String(print));
        };
        try {
            await run_with_input(program, ["1, 2", "3"]);
        } finally {
            Valence.interpreter.print_callback = false;
        }
        expect(printed).toStrictEqual(["3", "[1, 2]"]);
    });

    test('dequeue returns the inner queue intact', async () => {
        let program = `𐆋𐆋𐆋
𐆉𐆋𐆋
[𐆉]𐅻[𐅾𐆋]
[𐅻]𐆉[𐆁𐆉]
[𐅻]𐆉[𐆁𐆉]`;

        /*
        A = input(queue)    "1, 2"
        S = input(queue)    "3"
        S APPEND A          → [3, [1, 2]]
        D = dequeue(S)      → 3
        D = dequeue(S)      → [1, 2]
        */

        let [final_state] = await run_with_input(program, ["1, 2", "3"]);
        expect(final_state[5].toString()).toBe("[1, 2]");
        expect(final_state[4].value.length).toBe(0);
    });

    test('changing a queue after appending it does not change the copy inside', async () => {
        let program = `𐆋𐆋𐆋
𐆉𐆋𐆋
[𐆉]𐅻[𐅾𐆋]
[𐅻]𐆉[𐆁𐆋]`;

        /*
        A = input(queue)    "1, 2"
        S = input(queue)    "3"
        S APPEND A          → [3, [1, 2]]
        D = dequeue(A)      → A is [2], S should still be [3, [1, 2]]
        */

        let [final_state] = await run_with_input(program, ["1, 2", "3"]);
        expect(final_state[3].toString()).toBe("[2]");
        expect(final_state[4].toString()).toBe("[3, [1, 2]]");
    });
});

describe('append to a non-queue', () => {
    test('casts it to a queue as the first element', () => {
        expect(new v.Int(3).append(new v.Int(4)).toDisplay()).toBe("[3, 4]");
        expect(new v.Bool(false).append(new v.Int(1)).toDisplay()).toBe("[false, 1]");
        expect(new v.Ratio({num: 1, den: 2}).append(new v.Int(1)).toDisplay()).toBe("[1/2, 1]");
    });

    test('a string or char appends as text', () => {
        expect(new v.String("ab").append(new v.String("cd")).toDisplay()).toBe('"abcd"');
        expect(new v.String("H").append(new v.Char(105)).toDisplay()).toBe('"Hi"');
        expect(new v.Char(72).append(new v.Char(105)).toDisplay()).toBe('"Hi"');
        expect(new v.Char(72).append(new v.String("ello")).toDisplay()).toBe('"Hello"');
        expect(new v.Char(72).append(new v.Int(105)).toDisplay()).toBe('"Hi"');
        expect(new v.Char(65).append(new v.Bool(true)).toDisplay()).toBe('"Atrue"');
    });

    test('appending a queue nests it after the value', () => {
        let appended = new v.Int(3).append(new v.Queue([new v.Int(1), new v.Int(2)]));
        expect(appended.toString()).toBe("[3, [1, 2]]");
    });

    test('matches cast to queue, then append', () => {
        let val = new v.Int(3);
        let cast_first = v.build_val_obj("queue", val).append(new v.Int(4));
        expect(val.append(new v.Int(4))).toStrictEqual(cast_first);
    });

    test('in a program', async () => {
        let program = `[𐆉]𐆉[𐆇𐅻]
[𐆉]𐅻[𐆇𐆋]`;

        /*
        S = 5
        S APPEND 3
        */

        let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));
        let final_states = [];
        await Valence.interpreter.launch_all(progs, (id, ln, state) => { final_states[id] = state; }, 0);

        expect(final_states.length).toBeGreaterThan(0);
        final_states.forEach(state => expect(state[4].toDisplay()).toBe("[5, 3]"));
    });
});
