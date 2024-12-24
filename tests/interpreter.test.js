jest.setTimeout(5 * 1000);

if (!Valence) var Valence = {};

Valence.lexicon = require('../valence.lexicon');
Valence.parser = require('../valence.parser');
Valence.interpreter = require('../valence.interpreter');

beforeEach(() => jest.resetAllMocks());

test('interpreter completes', async () => {
    let program = "𐆇𐆉𐅶";
    await Valence.interpreter.interpret(program);
});

test('interpreter: synchronous call', () => {
    let program = "𐆇𐆉𐅶";
    Valence.interpreter.interpret(program, true);
});

test('interpret(): launches only successful builds', async () => {
    let program = "𐆇𐆉𐅶";
    await Valence.interpreter.interpret(program).then(data => {
        expect(data.length).toBe(2);
    });
});

test('interpret(): two-line program', async () => {
    let program = "𐆇𐆉[𐅾𐅶]\n𐅾𐅾𐆋";
    await Valence.interpreter.interpret(program).then(data => {
        expect(data.length).toBe(2);
    });
});

test('launch_all called twice', async () => {
    let program = "𐆇𐆉𐅶";
    const spy = jest.spyOn(Valence.interpreter._testing, '_launch_interpreter');
    Valence.interpreter.interpret(program).then( d => {
        expect(spy).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });
});

test('label is assigned at start of program', async () => {
    let program = "𐅾[𐅾𐅻]\n𐆉𐅻";
    let progs = JSON.parse(JSON.stringify(Valence.interpreter.parse_to_proglist(program)));
    progs = (Valence.interpreter._testing._mark_bad_programs(progs)).filter(p => !(p.failed === true));
    await Valence.interpreter.launch_all(progs, function(id, line, out, state) {
        expect(state[5]).toBe(1);
    });
});
