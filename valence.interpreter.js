if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
    var v = require('./valence.types');
}

Valence.interpreter = (function() {

    // first set of values for program: Ints from 0 to 7
    const initial_state = () => {
        let ret_arr = [];
        for (let i = 0; i < 8; i++) {
            ret_arr.push(new v.Int(i));
        }
        return ret_arr;
    }

    const key_to_idx = (key) => {
        return parseInt(Valence.lexicon[key].filter(x => x.type == 'digit')[0]['js']);
    }
    const idx_to_key = (idx) => {
        return Object.keys(Valence.lexicon)[idx];
    }

    var print_callback = false;

    var input_callback = false;


    const launch_interpreter = async (program, callback, delay) => {
        program.line_number = 0;

        // find initial state of all variables
        let state = initial_state();

        // evaluate all labels at launch in case there are jump-forwards
        // (these will be re-evaluated when we hit the label)
        for (let ln= 0; ln < program.length; ln++) {
            if (program[ln].reading.name === "label") {
                // FIXME: this needs to be added once the label command is evaluable

                // does not do callback or delay for pre-loading labels
                let loc = interpret_line(program, ln, state, null, null, 0, preload=true);
            }
        }

        // if there's a callback, call it with initial state
        if (callback) {
            callback(program.id, -1, state);
        }

        let curr_promise = new Promise(function(resolve, reject) {
            interpret_line(program, 0, state, resolve, callback, delay);
        });
        return curr_promise;
    };

    const run_command = (program, state, ln) => {
        let node = program[ln];
        let next_line = ln + 1;
        switch(node.reading.name) {
            // assignments
            case "append": {
                let varname = evaluate_to_var(node.params[0], state);
                state[varname.value] = state[varname.value].append(evaluate_exp(node.params[1], state));
                }
                break;
            case "assign": {
                let varname = evaluate_to_var(node.params[0], state);
                state[varname.value] = evaluate_exp(node.params[1], state);
                break;
            }
            case "add_assign": {
                let varname = evaluate_to_var(node.params[0], state);
                state[varname.value] = state[varname.value].add(evaluate_exp(node.params[1], state));
                }
                break;
            case "mult_assign":{
                let varname = evaluate_to_var(node.params[0], state);
                state[varname.value] = state[varname].mul(evaluate_exp(node.params[1], state));
                }
                break;
            case "label": {
                let varname = evaluate_to_var(node.params[0], state);
                state[varname.value] = new v.Int(ln);        
                }
                break;
            
            // flow control
            case "goto":
                // we go to whatever line that variable is set to
                let val = evaluate_exp(node.params[0], state).value;
                if (val < 0) val = 0 - val;
                if (val > 7) val = val % 8;
                next_line = state[val].value;
                break;
            case "jump":
                next_line = ln + new v.Int(v.Int.cast(evaluate_exp(node.params[0], state))).value;
                break;
            case "while":
            case "if":
                if (!(new v.Bool(v.Bool.cast(evaluate_exp(node.params[0], state)))).value) {
                    next_line = node.end + 1;
                    node.passed = false;
                } else {
                    node.passed = true;
                }
                break;
            case "while_queue":
                break; // TODO
            case "else":
            case "else_if":
                let already_ran = program[node.start].passed;
                program[node.start].elses.forEach(element => {
                    already_ran = already_ran || element.passed;
                });
                if (already_ran || 
                    (!(new v.Bool(v.Bool.cast(evaluate_exp(node.params[0], state)))).value)) {
                    next_line = node.end + 1;
                    node.passed = true;
                } else {
                    node.passed = false;
                }
                break;
                // need to check if condition first
                break; // TODO
            case "end_block":
                if (program[node.start].reading.name === "while") {
                    next_line = node.start;
                }
                break;    

            // I/O
            case "print": {
                if (!!Valence.interpreter.print_callback) {
                    let content = evaluate_exp(node.params[0], state);
                    Valence.interpreter.print_callback(program.id, content);
                }}
                break;




            // case "input":
            //     if (!!Valence.interpreter.input_callback)
            //         state[evaluate_to_type(node.params[0], state, "var", byref=true)] = Valence.interpreter.input_callback(program.id);
            //     break;

            default:
                throw {name : "InternalError", message : `no handling for command ${node.reading.name}`};
        }
        return next_line;
    }

    // return the INDEX of the variable as an Int object
    // (in case it needs to be further manipulated)
    const evaluate_to_var = (node, state) => {
        if (node.reading.type == "var") {
            return new v.Int(key_to_idx(node.reading.pseudo));
        }

        // if we get this far, it is an expression
        return new v.Int(v.Int.cast(evaluate_exp(node, state)) % 8);
    }

    const evaluate_to_type = (node, state) => {
        if (node.reading.type == "type") {
            return node.reading.name;
        }

        // if we get this far, it is an expression
        let type_node = new v.Int(evaluate(node, state)).value % 8;
        return Valence.lexicon[idx_to_key(type_node)].filter(x => x.type).name;
    }

    const evaluate_exp = (node, state) => {
        switch (node.reading.type) {
            case "digit":
                return new v.Int(node.reading.name);
            case "var":
                return state[key_to_idx(node.reading.pseudo)];
        }
        switch(node.reading.name) {
            case "read_as_digit":
                if (node.params[0].reading.type !== "digit") {
                    return new v.Int(evaluate_exp(node.params[0], state).value % 8);
                }
                return new v.Int(node.params[0].reading.name);
            case "read_as_var":
                // this returns the value of the var
                if (node.params[0].reading.type !== "var") {
                    throw {name: "TypeError", message: `var expected`};
                }  
                return state[key_to_idx(node.params[0].reading.pseudo)];
            case "not":
                return evaluate_exp(node.params[0], state).not();
            case "sub":
                return evaluate_exp(node.params[0], state).sub(evaluate_exp(node.params[1], state));
            case "add": {
                return evaluate_exp(node.params[0], state).add(evaluate_exp(node.params[1], state));
            }
            case "mul":
                return evaluate_exp(node.params[0], state).mul(evaluate_exp(node.params[1], state));
            case "div":
                return evaluate_exp(node.params[0], state).div(evaluate_exp(node.params[1], state));
            case "mult_by_eight":
                return evaluate_exp(node.params[0], state).mul(new v.Int(8));
            case "cast":
                return v.build_val_obj(evaluate_to_type(node.params[0]), evaluate_exp(node.params[1], state))
            case "equals":
                return evaluate_exp(node.params[0], state).equals(evaluate_exp(node.params[1], state));      
            case "int_or_floor":
                return new v.Int(v.Int.cast(evaluate_exp(node.params[0], state)));          
        }
    }

    const interpret_line = async (program, line, state, resolve, callback, delay, preload=false) => {
        const startTime = performance.now();

        // check for end of program
        if (!Valence.interpreter.is_playing || line >= program.length) {

            // callback one more time to clear highlit row
            if (callback) callback(program.id, -1, state);

            if (resolve)
                resolve();

            return;
        }        

        // actually run the line of code
        let next_line = run_command(program, state, line);

        // update output
        if (callback) callback(program.id, line, state);

        // where to go next in the program

        const endTime = performance.now();
        const time_to_wait = delay - (endTime - startTime); // sometimes negative

        if (preload)
            return;

        // the buffer and call to next step
        setTimeout(function() {
            const finalEnd = performance.now();
            // console logging for debug
            // console.log(`waiting ${time_to_wait}`);
            // console.log(`in total, took ${finalEnd - startTime}\n`);
            interpret_line(program, next_line, state, resolve, callback, delay);
        }, time_to_wait);
    };
    


    return {

        is_playing: false,

        initial_state: initial_state,

        key_to_idx: key_to_idx,

        node_delay: 1000,

        run: async function(program, wait = false) {

            // parse and keep only the runnable programs
            let progs = Valence.parser.parse(program, true).filter(p => !(p.failed === true));

            // return promise for each valid program
            if (!wait) {
                return this.launch_all(progs);
            } else {
                await this.launch_all(progs);
            }
        },

        launch_all: async function(progs, callback = false, delay = Valence.interpreter.node_delay) {
            Valence.interpreter.is_playing = true;

            // return promise for each valid program
            return Promise.all(progs.map(prog => { return launch_interpreter(prog, callback, delay); }));
        }
    };
})();


if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.interpreter;
}
