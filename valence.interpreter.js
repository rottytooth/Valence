if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = (function() {
    // FIXME: Valence.parser generates the various ASTs for each line and their readings, but Valence.interpreter parses those into full, program-long readings as parallel , and where blocks open and close. These should probably move to Valence.parser

    let node_delay = 500; 

    const parse_program = (program, to_file=false, outfile = null) => {
        // parse a program from text, output to either screen or a file
        if (!to_file) {
            parse_and_print(program);
            return;
        }
        if (!outfile) {
            outfile = `output/${program}.txt`;
        }
        fs.writeFile(outfile, generate_transpilations(program, true).log, (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    };

    const parse_file = (infile, to_file=false, outfile = null) => {
        // parse a .val file (requires node)
        fs.readFile(infile, 'utf8', (err, program) => {
            if (err) throw err;
            if (!to_file) {
                parse_and_print(program, outfile);
                return;
            }
            parse_program(program, to_file, outfile);
        });
    };

    const initial_state = () => {
        return [0,1,2,3,4,5,6,7];
    }

    const key_to_idx = (key) => {
        return parseInt(Valence.lexicon[key].filter(x => x.type == 'digit')[0]['js']);
    }

    const launch_interpreter = async (program, callback) => {
        program.line_number = 0;

        // find initial state of all variables
        let state = initial_state();

        // evaluate all labels at launch in case there are jump-forwards
        // (these will be re-evaluated when we hit the label)
        for (let ln= 0; ln < program.length; ln++) {
            if (program[ln].reading.name === "label") {
                let loc = evaluate_expression(program[ln].params[0], state, "var");
                state[loc] = ln; // assign the location of the label to its var
            }
        }

        // if there's a callback, call it with initial state
        if (callback) {
            callback(program.id, -1, "", state);
        }

        let curr_promise = new Promise(function(resolve, reject) {
            interpret_line(program, 0, state, resolve, callback);
        });
        return curr_promise;
    };

    // FIXME: seems unfortunate to do this after building the transpilation rules in the lexicon; alternative would be to use eval on the expression part and only hardcode commands here
    const run_command = (node, state) => {
        switch(node.reading.name) {
            case "while":
                // do we know end of the while?
        }
    }

    const evaluate_expression = (node, state, resolve_to) => {
        switch (node.reading.type) {
            case "var":
                // if we're looking for a var, return its location in the state array
                // if we're looking for a value, return the var's value
                if (resolve_to == "var") 
                    return key_to_idx(node.reading.pseudo);
                return state[key_to_idx(node.reading.pseudo)];
            case "digit":
                return 0; // TODO
        }
    };

    const interpret_line = async (program, line, state, resolve, callback) => {
        const startTime = performance.now();

        let output = null;

        // actually run the line of code
        run_command(program[line], state);

        // update output
        if (callback) callback(program.id, line, output, state);

        // where to go next in the program

        // check for end of program
        if (!Valence.interpreter.is_playing || program.line >= program.length) {
            resolve();
            return;
        }

        const endTime = performance.now();
        const time_to_wait = node_delay - (endTime - startTime); // sometimes negative

        // // the buffer and call to next step
        setTimeout(function() {
            const finalEnd = performance.now();
            console.log(`waiting ${time_to_wait}`);
            console.log(`in total, took ${finalEnd - startTime}\n`);
        }, time_to_wait);
    };
    


    return {

        node_delay: node_delay, // speed per line of code

        is_playing: false,

        // parse_and_print: function(program) {
        //     console.log(generate_transpilations(program).log);
        // },

        parse_program: parse_program,

        parse_file: parse_file,

        key_to_idx: key_to_idx,

        // exposing private methods for testing
        _testing : {

            _launch_interpreter: launch_interpreter
        },

        interpret: async function(program, wait = false) {
            Valence.interpreter.is_playing = true;

            // parse and keep only the runnable programs
            let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

            // return promise for each valid program
            if (!wait) {
                return Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            } else {
                await Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            }
        },

        launch_all: async function(progs, callback = false) {
            // return promise for each valid program
            return Promise.all(progs.map(prog => { return launch_interpreter(prog, callback); }));
        }
    };
})();


if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.interpreter;
}
