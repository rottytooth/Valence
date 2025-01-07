jest.setTimeout(5 * 1000);

if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');
Valence.interpreter = require('../valence.interpreter');

beforeEach(() => jest.resetAllMocks());

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
        expect(state[0]).toBe(0); // second line assignment should be skipped, leaving this 0
        expect(state[5]).toBe(2); // label has been assigned its line number
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

    expect(final_state[0]).toBe(9);
    expect(final_state[1]).toBe(10);
    expect(final_state[2]).toBe(6);
    expect(final_state[3]).toBe(7);
    expect(final_state[4]).toBe(8);
    expect(final_state[5]).toBe(0);
    expect(final_state[6]).toBe(3);
    expect(final_state[7]).toBe(5);
});

test('line order: label, goto, jump', async () => {
    let program = `𐆉𐆉
𐅻[𐅾𐅾]
𐅾[𐅾𐆉]
𐆉𐆋`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    const expected_lines = [0, 1, 3];
    let curr_line = 0;

    const callback = (id, ln, state) => {
        if (ln == -1) return;
        expect(ln).toBe(expected_lines[curr_line]);
        curr_line++;
    };

    await Valence.interpreter.launch_all(progs, callback, 0);

});

test('state: label, goto, jump', async () => {
    let program = `𐆉𐆉
𐅻[𐅾𐅾]
𐅾[𐅾𐆉]
𐆉𐆋`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    const expected_states = [
        [0, 1, 2, 3, 0, 5, 6, 7], 
        [0, 1, 2, 3, 0, 5, 6, 7], 
        [0, 1, 2, 3, 0, 5, 6, 7]];
    let curr_line = 0;

    const callback = (id, ln, state) => {
        if (ln == -1) return;
        expect(state).toStrictEqual(expected_states[curr_line]);
        curr_line++;
    };

    await Valence.interpreter.launch_all(progs, callback);
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
    expect(final_state[1]).toBe(4); //  𐆇 should be 4
    expect(final_state[5]).toBe(3); //  𐅻 should be 3
});

test('print', async () => {
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

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = "";
    Valence.interpreter.print_callback = (id, print) => {
        output += print;
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
        output += print;
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
        output += print;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

    // test final_state    
    expect(output).toBe("4411");

});

test('alt progs: two with while loop', async () => {
    let program = `𐅶[𐅶[𐅾𐅶]𐆇[[𐅻[𐆇𐆁]]𐅶[𐆇𐆋]]]
[𐅶]𐅶𐅾
[𐅾]𐅶[𐆇𐆇]
𐆋[𐅾𐅶]
𐅾`;

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    let output = [];
    Valence.interpreter.print_callback = (id, print) => {
        if (!(output.includes(id))) {
            output[id] = "";
        }
        output[id] += print;
    };

    await Valence.interpreter.launch_all(progs, false, 0);

});
