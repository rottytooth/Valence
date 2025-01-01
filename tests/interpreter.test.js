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
    let program = "𐆇𐆉[𐅾𐅶]\n𐅾𐅾𐆋";
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
    
    await Valence.interpreter.launch_all(progs, callback).then(d =>{
        expect(called.length).toBe(2);
    });
});

test('label is assigned at start of program', async () => {
    let program = "𐅾[𐅾𐅻]\n𐆉𐅻";

    let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

    const callback = (id, ln, state) => {
        expect(state[5]).toBe(0);
    };

    await Valence.interpreter.launch_all(progs, callback);
}); // FIXME: this is in progress

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

    await Valence.interpreter.launch_all(progs, callback);

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
