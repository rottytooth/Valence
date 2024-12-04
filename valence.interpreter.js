if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    Valence.lexicon = require('./valence.lexicon');
    Valence.parser = require('./valence.parser');
}

const transpile_js = (ast) => {
    localstr = ast.reading.js;

    for(let i = 0; i < ast.params.length; i++) {
        let name = null;
        if (Object.hasOwn(ast.reading.params[i],"name"))
            name = ast.reading.params[i].name;
        else
            name = ast.reading.params[i].type;

        localstr = localstr.replaceAll("{"+name+"}", transpile_js(ast.params[i]));
    }
    return localstr;
}

const parse = (program, complete = false) => {
    parsed_prog = Valence.parser.parse(program, complete);
    for(let i = 0; i < parsed_prog.length; i++) {
        // for each line
        retstr += parsed_prog[i].line + "\n";
        for(let j = 0; j < parsed_prog[i].asts.length; j++) {
            // for each reading of that line
            retstr += parsed_prog[i].asts[j].line + "\n";
            retstr += transpile_js(parsed_prog[i].asts[j]) + "\n";
        }
    }
    parsed_prog.log = retstr;
    return parsed_prog;
}

const parse_and_print = (program) => {
    console.log(parse(program).log);
}

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
}

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
}


// DEBUG

//parse_program("𐅾");
// parse_program("𐆇𐆊𐅶")
parse_file("programs/hello_world.val", true);

// parse_to_file("𐆇[𐆇𐆇[𐆊𐅶]]")
// parse_to_file("[𐆋]𐆇[[𐆋]𐅾[[𐆊]𐅾[[𐅶]𐅾[𐅾]]]]")
