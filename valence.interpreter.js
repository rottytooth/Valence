if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = (function() {

    const initial_state = () => {
        return [0,1,2,3,4,5,6,7];
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
            // flow control
            case "while":
            case "if":
                if (!evaluate_to_type(node.params[0], state, "bool")) {
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
                next_line = ln + evaluate_to_type(node.params[0], state, "int");
                break;
            case "goto":
                // we go to whatever line that variable is set to
                next_line = evaluate_to_type(node.params[0], state, "int");
                break;
            
            // case "for":
            //     if (state[evaluate_to_type(node.params[1])]
            //     break;

            // assignments
            case "append": {
                let varname = evaluate_to_type(node.params[0], "var", byref=true);
                if (!Array.isArray(state[varname])) {
                    state[varname] = [state[varname]];
                }
                state[varname].push(evaluate_to_type(node.params[1], state, "exp"));
                }
                break;
            case "assign":
                state[evaluate_to_type(node.params[0], state, "var", byref=true)] = evaluate_to_type(node.params[1], state, "exp");
                break;
            case "add_assign": {
                let varname = evaluate_to_type(node.params[0], state, "var", byref=true);
                state[varname] = add_params(state[varname], node.params[1], state);
                }
                break;
            case "sub_assign": {
                let varname = evaluate_to_type(node.params[0], state, "var", byref=true);
                state[varname] = state[varname] - evaluate_to_type(node.params[1], state, "exp");
                }
                break;
            case "mult_assign":{
                let varname = evaluate_to_type(node.params[0], state, "var", byref=true);
                state[varname] = state[varname] * evaluate_to_type(node.params[1], state, "exp");
                }
                break;
            case "label":
                state[key_to_idx(node.params[0].reading.pseudo)] = ln;            
                break;

                // I/O
            case "print": {
                if (!!Valence.interpreter.print_callback) {
                    let content = evaluate_to_type(node.params[0], state, "exp");
                    Valence.interpreter.print_callback(program.id, content);
                }}
                break;
            case "input":
                if (!!Valence.interpreter.input_callback)
                    state[evaluate_to_type(node.params[0], state, "var", byref=true)] = Valence.interpreter.input_callback(program.id);
                break;
            case "randomize":
                break;

            default:
                throw {name : "InternalError", message : `no handling for command ${node.reading.name}`};
        }
        return next_line;
    }

    const evaluate_to_type = (node, state, resolve_to, byref=false) => {
        // resolve_to could be from lexicon or from type()
        
        switch(resolve_to) {
            case "exp":
                return evaluate_exp(node, state);
            case "bool":
                return !!(evaluate_exp(node, state));
            case "var":
                return evaluate_to_type(node, state, "int", byref);
            case "digit":
                return Math.floor(evaluate_exp(node, state)) % 8;
            case "char":
                return String.fromCharCode(evaluate_to_type(node, state, "int"));
            case "int": {
                let retval = evaluate_exp(node, state, byref);
                switch(typeof(retval)) {
                    case "number":
                        return Math.floor(retval);
                    case "string":
                        if (retval.length === 1) {
                            return retval.charCodeAt(0);
                        }
                        return parseInt(retval);
                    case "boolean":
                        if (retval)
                            return 1;
                        return 0;
                    default:
                        throw {name: "TypeError", message: `cannot convert ${retval} to int`};
                }
            }
        }
    }

    const add_params = (first_param, second_param, state) => {
        // param_one = a value
        // param_two = a node to be evaluated in terms of param_one's type

        switch(typeof(first_param)) {
            case "number":
                return first_param + evaluate_to_type(second_param, state, "int", byref);
            case "string":
                return first_param + evaluate_to_type(second_param, state, "string", byref);
            case "char":
                if (typeof(second_param) == "number") {
                    return first_param + String.fromCharCode(evaluate_to_type(second_param, state, "int", byref));
                }
                // if (second_param.reading.name === "char") 
                return first_param + evaluate_to_type(second_param, state, "int", byref);
            default:
                return first_param + evaluate_to_type(second_param, state, "int", byref);
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
                return parseInt(node.reading.name);
            case "type":
                return node.reading.name;
            case "exp":
                switch(node.reading.name) {
                    case "read_as_int":
                        return evaluate_to_type(node.params[0], state, "int", byref);
                    case "to_str":
                        return String(evaluate_to_type(node.params[0], state, "exp", byref));
                    case "read_as_var":
                        // ref
                        return evaluate_to_type(node.params[0], state, "exp", true);
                    case "not":
                        return !(evaluate_to_type(node.params[0], state, "bool", byref));
                    case "sub":
                        return evaluate_to_type(node.params[0], state, "int", byref) - evaluate_to_type(node.params[1], state, "int", byref);
                    case "add": {
                        return add_params(evaluate_to_type(node.params[0], state, "int", byref), node.params[1], state);
                    }
                    case "mul":
                        return evaluate_to_type(node.params[0], state, "int", byref) * evaluate_to_type(node.params[1], state, "int", byref);
                    case "mult_by_eight":
                        // may need to check by type
                        return evaluate_to_type(node.params[0], state, "int", byref) * 8;
                    case "value":
                        // deref and convert to type specified in first child node
                        return evaluate_to_type(node.params[1], state, node.params[0].reading.name, false);
                }
        }
    };

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
