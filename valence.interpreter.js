if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
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
            name = ast.reading.params[0].type;

        localstr = localstr.replaceAll("{"+name+"}", transpile_js(ast.params[i]));
    }
    return localstr;
}

const parse_and_print = (line) => {
    tree = Valence.parser.parse(line, false);
    for(let i = 0; i < tree.length; i++) {
        console.log(tree[i].line);
        for(let j = 0; j < tree[i].asts.length; j++) {
            console.log(tree[i].asts[j].line);
            console.log(transpile_js(tree[i].asts[j]));
        }
    }
}

// parse_and_print("𐆋𐆇𐆋𐅾𐆊𐅾𐅶𐅾𐅾");
// parse_and_print("𐆇𐆊𐅶")
// parse_and_print("𐆇[𐆇𐆇[𐆊𐅶]]")
parse_and_print("[𐆋]𐆇[[𐆋]𐅾[[𐆊]𐅾[[𐅶]𐅾[𐅾]]]]")
