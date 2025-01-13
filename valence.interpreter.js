if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = (function() {

    // each VALUE type relies on the goodwill of the interpreter to correctly assign
    // its value argument. Each provides the same set of methods to handle conversions
    // to its type and other operations on that type

    const build_val_obj = (type, value) => {
        switch(type) {
            case "int":
                return new Int(Int.cast(value));
            case "char":
                return new Char(Char.cast(value));
            case "bool":
                return new Bool(Bool.cast(value));
            case "string":
                return new v_String(v_String.cast(value));
            case "ratio":
                return new Ratio(Ratio.cast(value));
            case "queue":
                return new Queue(Queue.cast(value));
        }
    }

    class Int {
        constructor(initial_value) {
            if (typeof(initial_value) == "string") {
                initial_value = parseInt(initial_value);
            }
            this.type = "int";
            if (Object.hasOwn(initial_value, 'type')) {
                this.value = Int.cast(initial_value);
            } else {
                // assumes a direct assignment will be in interpreter, and of correct type
                this.value = initial_value;
            }
        }

        static cast(value) {
            switch (value.type) {
                case "int":
                    return value.value;
                case "char":
                    return value.value.charCodeAt(0);
                case "bool":
                    return value.value > 0 ? 1 : 0;
                case "string":
                    return parseInt(value.value);
                case "ratio":
                    return Math.floor(value.num / value.den);
                case "queue":
                    return Int.cast(value.dequeue());
            }
        }

        toString() {
            return this.value;
        }
        toDisplay() {
            return this.value;
        }

        add(value) {
            return new Int(this.value + Int.cast(value));
        };
        sub(value) {
            return new Int(this.value - Int.cast(value));
        };
        mul(value) {
            return new Int(this.value * Int.cast(value));
        };
        div(value) {
            return new Int(this.value / Int.cast(value));
        };
        not(value) {
            return new Int(0 - this.value);
        }
    }

    class Char extends Int {
        // internal storage for Char is an Int

        constructor(initial_value) {
            super(initial_value);
            this.type = "char";
        }

        toString() {
            return String.fromCharCode(this.value);
        }
        toDisplay() {
            return "'" + String.fromCharCode(this.value) + "'";
        }

        add(value) {
            return new Char(super.add(value));
        }

        append(value) {
            if (value.type == "char" || value.type == "int") {
                return new v_String(
                    String.fromCharCode(this.value) + 
                    String.fromCharCode(value.value));
            }
            if (value.type == "string") {
                return new v_String(
                    String.fromCharCode(this.value) + value.value);
            }
        }

    }

    class v_String {
        constructor(initial_value) {
            this.value = initial_value.toString();
            this.type = "string";
        }

        static cast(value) {
            switch (value.type) {
                case "int":
                case "char":
                    return String.fromCharCode(value.value);
                case "bool":
                case "ratio":
                    return value.toString();
                case "string":
                    return value.value;
                case "queue":
                    return value.dequeue().toString();
            }
        }

        toString() {
            return this.value;
        }
        toDisplay() {
            return '"' + this.value + '"';
        }

        add(value) {
            return new v_String(this.value + v_String.cast(value));
        };

        append(value) {
            return this.add(value);
        }
    }

    const initial_state = () => {
        let ret_arr = [];
        for (let i = 0; i < 8; i++) {
            ret_arr.push(new Int(i));
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
                state[varname.value] = new Int(ln);        
                }
                break;
            
            // flow control
            case "goto":
                // we go to whatever line that variable is set to
                next_line = state[evaluate_exp(node.params[0], state).value].value;
                break;
            case "jump":
                next_line = ln + new Int(Int.cast(evaluate_exp(node.params[0], state))).value;
                break;
            case "while":
            case "if":
                if (!Bool(Bool.cast(evaluate_exp(node.params[0], state))).value) {
                    next_line = node.end + 1;
                }
                break;
            case "while_queue":
                break; // TODO
            case "else":
            case "else_if":
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
            return new Int(key_to_idx(node.reading.pseudo));
        }

        // if we get this far, it is an expression
        return new Int(Int.cast(evaluate_exp(node, state)) % 8);
    }

    const evaluate_to_type = (node, state) => {
        if (node.reading.type == "type") {
            return node.reading.name;
        }

        // if we get this far, it is an expression
        let type_node = new Int(evaluate(node, state)).value % 8;
        return Valence.lexicon[idx_to_key(type_node)].filter(x => x.type).name;
    }

    const evaluate_exp = (node, state) => {
        switch (node.reading.type) {
            case "digit":
                return new Int(node.reading.name);
            case "var":
                return state[key_to_idx(node.reading.pseudo)];
        }
        switch(node.reading.name) {
            case "read_as_digit":
                if (node.params[0].reading.type !== "digit") {
                    throw {name : "TypeError", message : `cannot convert ${node.params[0].reading.type} to digit`};
                }
                return new Int(node.params[0].reading.name);
            case "read_as_var":
                // this returns the value of the var
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
                return evaluate_exp(node.params[0], state).mul(new Int(8));
            case "cast":
                return build_val_obj(evaluate_to_type(node.params[0]), evaluate_exp(node.params[1], state))
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
