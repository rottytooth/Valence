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

test('goto: nearest label above, otherwise first label below', async () => {
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

    expect(await run_lines(program)).toStrictEqual([[0, 3, 4, 1, 2, 7]]);
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