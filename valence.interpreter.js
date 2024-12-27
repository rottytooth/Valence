if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = (function() {

    var print_callback = false;

    var input_callback = false;

    let node_delay = 500; 

    const initial_state = () => {
        return [0,1,2,3,4,5,6,7];
    }

    const key_to_idx = (key) => {
        return parseInt(Valence.lexicon[key].filter(x => x.type == 'digit')[0]['js']);
    }
    const idx_to_key = (idx) => {
        return Object.keys(Valence.lexicon)[idx];
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
    const run_command = (program, state, ln) => {
        let node = program[ln];
        let next_line = ln + 1;
        switch(node.reading.name) {
            // flow control
            case "while":
            case "if":
                if (!evaluate_to_type(node.params[0], "bool")) {
                    next_line = node.end + 1;
                }
                break;
            case "else":
            case "else_if":
                // need to check if condition first
                break;
            case "end_block":
                if (program[node.start].reading.name === "while") {
                    next_line = node.start;
                }
                break;
            case "jump":
                next_line = ln + evaluate_to_type(node.params[0], "int");
                break;
            case "goto":
                // we go to whatever line that variable is set to
                next_line = state[evaluate_to_type(node.params[0], "var")];
                break;
            // case "for":
            //     if (state[evaluate_to_type(node.params[1])]
            //     break;

            // assignments
            case "append": {
                let varname = evaluate_to_type(node.params[0], "var");
                if (!Array.isArray(state[varname])) {
                    state[varname] = [state[varname]];
                }
                state[varname].push(evaluate_to_type(node.params[1], "exp"));
                }
                break;
            case "assign":
                state[evaluate_to_type(node.params[0], "var")] = evaluate_to_type(node.params[1], "exp");
                break;
            case "add_assign": {
                let varname = evaluate_to_type(node.params[0], "var");
                state[varname] = state[varname] + evaluate_to_type(node.params[1], "exp");
                }
                break;
            case "sub_assign": {
                let varname = evaluate_to_type(node.params[0], "var");
                state[varname] = state[varname] - evaluate_to_type(node.params[1], "exp");
                }
                break;
            case "mult_assign":{
                let varname = evaluate_to_type(node.params[0], "var");
                state[varname] = state[varname] * evaluate_to_type(node.params[1], "exp");
                }
                break;
            case "mult_by_eight":
                // may need to check by type
                state[node.params[0].reading.pseudo] = state[node.params[0].reading.pseudo] * 8;
            case "label":
                state[node.params[0].reading.pseudo] = ln;            
                break;

                // I/O
            case "print":
                if (!!print_callback)
                    print_callback(program.id, evaluate_to_type(node.params[0], "exp"));
                break;
            case "input":
                if (!!input_callback)
                    state[evaluate_to_type(node.params[0], "var")] = input_callback(program.id);
                break;
            case "randomize":
                break;

            default:
                throw {name : "InternalError", message : `no handling for command ${node.reading.name}`};
        }
        return next_line;
    }

    const evaluate_to_type = (node, state, resolve_to) => {
        switch(resolve_to) {
            case "bool":
                return !!(evaluate_exp(node, state));
            case "var":
                return state[Math.floor(evaluate_exp(node, state, byref=true)) % 8];
            case "digit":
                return Math.floor(evaluate_exp(node, state)) % 8;
            case "int":
                break;
        }
    }

    const evaluate_exp = (node, state, byref=false) => {
        // byref tells us we return the name (loc) of the var rather than its value

        switch (node.reading.type) {
            case "var":
                // if we're looking for a var, return its location in the state array
                // if we're looking for a value, return the var's value
                if (byref)
                    return key_to_idx(node.reading.pseudo);
                return state[key_to_idx(node.reading.pseudo)];
            case "digit":
                return 0; // TODO
            case "exp":
            case "int":
            case "ratio":
        }
    };

    const interpret_line = async (program, line, state, resolve, callback) => {
        const startTime = performance.now();

        let output = null;

        // check for end of program
        if (!Valence.interpreter.is_playing || line >= program.length) {

            // callback one more time to clear highlit row
            if (callback) callback(program.id, -1, "", state);

            resolve();
            return;
        }        

        // actually run the line of code
        let next_line = run_command(program, state, line);

        // update output
        if (callback) callback(program.id, line, output, state);

        // where to go next in the program

        const endTime = performance.now();
        const time_to_wait = node_delay - (endTime - startTime); // sometimes negative

        // the buffer and call to next step
        setTimeout(function() {
            const finalEnd = performance.now();
            console.log(`waiting ${time_to_wait}`);
            console.log(`in total, took ${finalEnd - startTime}\n`);
            interpret_line(program, next_line, state, resolve, callback);
        }, time_to_wait);
    };
    


    return {

        node_delay: node_delay, // speed per line of code

        is_playing: false,

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
