if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

Valence.interpreter = {};

Valence.interpreter.transpile_js = (ast, use_pseudo) => {
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
}

Valence.interpreter.parse = (program, complete = false) => {
    parsed_prog = Valence.parser.parse(program, complete);

    let retstr = "";
    
    for(let i = 0; i < parsed_prog.length; i++) {
        // for each line
        retstr += parsed_prog[i].line + "\n";
        for(let j = 0; j < parsed_prog[i].asts.length; j++) {
            // for each reading of that line
            retstr += parsed_prog[i].asts[j].line + "\n";
            parsed_prog[i].asts[j].reading.pseudo = parsed_prog[i].asts[j].reading.js;
            parsed_prog[i].asts[j].reading.js = Valence.interpreter.transpile_js(parsed_prog[i].asts[j], false);
            parsed_prog[i].asts[j].reading.pseudo = Valence.interpreter.transpile_js(parsed_prog[i].asts[j], true);
            retstr += parsed_prog[i].asts[j].reading.pseudo + "\n";
        }
    }
    parsed_prog.log = retstr;
    return parsed_prog;
}

Valence.interpreter.parse_and_print = (program) => {
    console.log(Valence.interpreter.parse(program).log);
}

Valence.interpreter.parse_program = (program, to_file=false, outfile = null) => {
    // parse a program from text, output to either screen or a file
    if (!to_file) {
        Valence.interpreter.parse_and_print(program);
        return;
    }
    if (!outfile) {
        outfile = `output/${program}.txt`;
    }
    fs.writeFile(outfile, parse(program, true).log, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

Valence.interpreter.parse_file = (infile, to_file=false, outfile = null) => {
    // parse a .val file (requires node)
    fs.readFile(infile, 'utf8', (err, program) => {
        if (err) throw err;
        if (!to_file) {
            Valence.interpreter.parse_and_print(program, outfile);
            return;
        }
        Valence.interpreter.parse_program(program, to_file, outfile);
    });
}

Valence.interpreter.parse_to_proglist = (program) => {
    let parsed = Valence.interpreter.parse(program.trim(), true);
    let progs = [];

    // first line creates the initial trees
    for (let q = 0; q < parsed[0].asts.length; q++) {
        progs.push([JSON.parse(JSON.stringify(parsed[0].asts[q]))]);
    }

    for (let p = 1; p < parsed.length; p++) {
        let progs_new = [];
        for (let q = 0; q < parsed[p].asts.length; q++) {
            for (let r = 0; r < progs.length; r++) {
                new_prog = JSON.parse(JSON.stringify(progs[r]));
                new_prog.push(JSON.parse(JSON.stringify(parsed[p].asts[q])));
                progs_new.push(new_prog);
            }
        }
        progs = progs_new;
    }

    return progs;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.interpreter;
}