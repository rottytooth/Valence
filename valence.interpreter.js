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

const parse = (program, retstr = "") => {
    parsed_prog = Valence.parser.parse(program, false);
    for(let i = 0; i < parsed_prog.length; i++) {
        retstr += parsed_prog[i].line + "\n";
        for(let j = 0; j < parsed_prog[i].asts.length; j++) {
            retstr += parsed_prog[i].asts[j].line + "\n";
            retstr += transpile_js(parsed_prog[i].asts[j]) + "\n";
        }
    }
    return retstr;
}

const parse_to_file = (program, outfile) => {
    if (!outfile) {
        outfile = `output/${program}.txt`;
    }
    fs.writeFile(outfile, parse(program), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

const parse_and_print = (program) => {
    console.log(parse(program));
}


parse_to_file("𐆋𐆇𐆋𐅾𐆊𐅾𐅶𐅾𐅾");
// parse_to_file("𐆇𐆊𐅶")
// parse_to_file("𐆇[𐆇𐆇[𐆊𐅶]]")
// parse_to_file("[𐆋]𐆇[[𐆋]𐅾[[𐆊]𐅾[[𐅶]𐅾[𐅾]]]]")
