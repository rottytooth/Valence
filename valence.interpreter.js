if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = (function() {

    let node_delay = 500; 

    const transpile_js = (ast, use_pseudo) => {
        let localstr = ast.reading.js;
        if (use_pseudo && Object.hasOwn(ast.reading,"pseudo")) {
            localstr = ast.reading.pseudo;
        }
    
        for(let i = 0; i < ast.params.length; i++) {
            let name = null;
            if (Object.hasOwn(ast.reading.params[i],"name"))
                name = ast.reading.params[i].name;
            else
                name = ast.reading.params[i].type;
    
            let replacement = Valence.interpreter.transpile_js(ast.params[i], use_pseudo);
            localstr = localstr.replaceAll("{"+name+"}", replacement);
        }
        return localstr;
    };

    const parse = (program, complete = false) => {
        parsed_prog = Valence.parser.parse(program, complete);
    
        let retstr = "";
        
        for(let i = 0; i < parsed_prog.length; i++) {
            // for each line
            retstr += parsed_prog[i].line + "\n";
            for(let j = 0; j < parsed_prog[i].asts.length; j++) {
                // for each reading of that line
                retstr += parsed_prog[i].asts[j].line + "\n";
                if (parsed_prog[i].asts[j].reading.pseudo === undefined) {
                    parsed_prog[i].asts[j].reading.pseudo = parsed_prog[i].asts[j].reading.js;
                }
                parsed_prog[i].asts[j].reading.js = transpile_js(parsed_prog[i].asts[j], false);
                parsed_prog[i].asts[j].reading.pseudo = transpile_js(parsed_prog[i].asts[j], true);
                retstr += parsed_prog[i].asts[j].reading.pseudo + "\n";
            }
        }
        parsed_prog.log = retstr;
        return parsed_prog;
    };

    const parse_program = (program, to_file=false, outfile = null) => {
        // parse a program from text, output to either screen or a file
        if (!to_file) {
            parse_and_print(program);
            return;
        }
        if (!outfile) {
            outfile = `output/${program}.txt`;
        }
        fs.writeFile(outfile, parse(program, true).log, (err) => {
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

    const parse_to_proglist = (program) => {
        let parsed = parse(program.trim(), true);
        let progs = [];
    
        // first line creates the initial trees
        for (let q = 0; q < parsed[0].asts.length; q++) {
            progs.push([JSON.parse(JSON.stringify(parsed[0].asts[q]))]);
        }
    
        for (let p = 1; p < parsed.length; p++) {
            let progs_new = [];
            for (let q = 0; q < parsed[p].asts.length; q++) {
                for (let r = 0; r < progs.length; r++) {
                    if (progs[r].length > Valence.parser.MAX_ASTS) {
                        throw new Error("Too many ASTs");
                    }
                    new_prog = JSON.parse(JSON.stringify(progs[r]));
                    new_prog.push(JSON.parse(JSON.stringify(parsed[p].asts[q])));
                    progs_new.push(new_prog);
                }
            }
            progs = progs_new;
        }

        for (let p = 0; p < progs.length; p++) {
            progs[p].id = p;
        }
    
        mark_bad_programs(progs);
        return progs;
    };

   const mark_bad_programs = (progs) => {
        // this both modifies progs by ref and returns it
        for (let i = 0; i < progs.length; i++) {
            var stack = [];
            for (let ln = 0; ln < progs[i].length; ln++) {

                if (["if", "while", "for"].includes(progs[i][ln].reading.name)) {
                    stack.push({ line: ln, cmd: progs[i][ln].reading.name});
                }
                else if (["else_if", "else"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0 || stack[stack.length-1].cmd !== "if") {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    }
                }
                else if (["end_block"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0) {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    }
                    stack.pop();
                }
            }
            if (stack.length > 0) {
                progs[i].failed = true;
                progs[i].bad_line = stack[stack.length-1].line;
            }
        }
        return progs;
    };

    const initial_state = () => {
        return [0,1,2,3,4,5,6,7];
    }

    const launch_interpreter = async (program) => {
        program.line_number = 0;
        let curr_promise = new Promise(function(resolve, reject) {
            interpret_line(program, 0, initial_state(), resolve);
        });
        return curr_promise;
    };

    const interpret_line = async (program, line, state, resolve, callback) => {
        const startTime = performance.now();

        let output = null;

        // actually run the line of code

        // where to go next in the program

        // update output
        // callback(program_id, line, output);

        // check for end of program
        if (!Valence.interpreter.is_playing || program.line >= program.length) {
            return;
        }

        const endTime = performance.now();
        const time_to_wait = node_delay - (endTime - startTime); // sometimes negative

        // // the buffer and call to next step
        setTimeout(function() {
            const finalEnd = performance.now();
            console.log(`waiting ${time_to_wait}`);
            console.log(`in total, took ${finalEnd - startTime}\n`);
            resolve({state});
        }, time_to_wait);
    };
    


    return {

        node_delay: node_delay, // speed per line of code

        is_playing: false,

        transpile_js: transpile_js,
        
        parse: parse,

        parse_and_print: function(program) {
            console.log(parse(program).log);
        },

        parse_program: parse_program,

        parse_file: parse_file,

        parse_to_proglist: parse_to_proglist,

        // exposing private methods for testing
        _testing : {

            _mark_bad_programs: mark_bad_programs,

            _launch_interpreter: launch_interpreter
        },

        interpret: async function(program, wait = false) {
            Valence.interpreter.is_playing = true;

            // parse and keep only the runnable programs
            let progs = JSON.parse(JSON.stringify(parse_to_proglist(program)));
            progs = (mark_bad_programs(progs)).filter(p => !(p.failed === true));

            // return promise for each valid program
            if (!wait) {
                return Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            } else {
                await Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            }
        },

        launch_all: async function(progs, wait = false) {
            // return promise for each valid program
            if (!wait) {
                return Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            } else {
                await Promise.all(progs.map(prog => { return launch_interpreter(prog); }));
            }
        }
    };
})();


if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.interpreter;
}
