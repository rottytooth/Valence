const { start } = require('node:repl');
const fs = require('node:fs'); // temporary, for testing

const outfilename = "test4";

if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    Valence.lexicon = require('./valence.lexicon');
}

class scanner {

    static get_noncommand(i, line, instructions) {
        // Capture text outside the alphabet in case it's used as a constant
        // Returns -1 if unhandled, otherwise returns new index
        let capture = "";
        for ( ; i < line.length && !(line[i] in Valence.lexicon); i++) {
            capture += line[i];
        }
        capture = capture.trim();

        if (!capture) {
            // nothing captured, nothing handled
            return -1;
        }

        let num = NaN;
        if (capture.indexOf(".") >= 0) {
            // attempt float
            num = parseFloat(capture);
            if (!isNaN(num)) {
                instructions.push([{
                    symbol: num,
                    type: "float",
                    val: num,
                    js: capture
                }]);        
                return i;
            }
        }
        num = parseInt(capture);
        if (!isNaN(num)) {
            // attempt int
            instructions.push([{
                symbol: num,
                type: "int",
                val: num,
                js: capture
            }]);        
            return i;
        }

        // otherwise, take as a string
        instructions.push([{
            symbol: capture,
            type: "str",
            val: capture,
            js: '"' + capture + '"'
        }]);
        return i;
    }

    static scan(line) {
        let instructions = [];

        line = [...line]; // convert to array for easier manipulation

        for (let i = 0; i < line.length; i++) {

            // if it's whitespace, skip it
            if (line[i] === ' ') {
                continue;
            }

            // first, is this punctuation (a bracket or comma)?
            if (line[i] === '[') {
                instructions.push([{
                    symbol: '[',
                    type: "open_bracket",
                    val: '['
                }]);        
                continue;
            }
            if (line[i] === ',') {
                instructions.push([{
                    symbol: ',',
                    type: "comma",
                    val: ','
                }]);        
                continue;
            }
            if (line[i] === ']') {
                instructions.push([{
                    symbol: ']',
                    type: "close_bracket",
                    val: ']'
                }]);        
                continue;
            }

            // handle if code is outside the alphabet
            let new_idx = scanner.get_noncommand(i, line, instructions);
            if (new_idx >= 0) {
                i = new_idx;
                continue;
            }

            // everything else is a single character
            let curr_char = line[i]
            let k = Valence.lexicon[curr_char];
            if (k !== undefined) {
                let augmented_list = k.map( x => {x.symbol = curr_char; return x;});
                instructions.push(augmented_list);
            } else {
                // we should never get here
                throw new Error(`Unknown character: ${curr_char}`);
            }
        }
        return instructions;
    };

    static evaluate_line(line) {
        line = line.trim();
        return {
            line: line,
            tokens: scanner.scan(line),
            built: false
        }
    };
}

parser = (function() {
    
    var program = [];

    // const next_unpopulated_expression = (node, type="var") => {
    //     // defaults to "var" as that is the widest set of options

    //     if (!("children" in node)) {
    //         // no children to process
    //         return null;
    //     }

    //     for (let i = 0; i < node.children.length; i++) {
    //         // A var or an exp can both be {exp}s, but only a var is a {var}
    //         if (!("name" in node.children[i]) &&
    //             !("val" in node.children[i]) // must have name or val to be populated
    //             && 
    //             (node.children[i].type == "exp" || 
    //             (node.children[i].type == "var" && type == "var"))) {

    //             // child is unassigned

    //             // mark what the child was originally (its type), so we know when a var is being used as an exp
    //             node.children[i].role = node.children[i].type; 
    //             return node.children[i];
    //         } else {
    //             let exp_match = next_unpopulated_expression(node.children[i]);
    //             if (exp_match !== undefined && exp_match !== null) {
    //                 return exp_match;
    //             }
    //         }
    //     }
    // }

    // const populate_tree_with_expressions = (cmdtree, built_lines) => {
    //     // check if completely populated
    //     if (!next_unpopulated_expression(cmdtree.command)) {
    //         // check if all tokens are used -- if so, keep as completed
    //         if (cmdtree.tokens.length == 0) {
    //             cmdtree.full_js = transpile_js(cmdtree.command);
    //             cmdtree.built = true;

    //             if (!built_lines.find(x => x.full_js == cmdtree.full_js))
    //                 built_lines.push(cmdtree);
    //         }
    //         return;
    //     }
    //     // run through each possible expression to use
    //     for (let i = 0; i < cmdtree.tokens.length; i++) {

    //         // if (cmdtree.command.children.length == 0) continue;

    //         for(let j = 0; j < cmdtree.tokens[i].length; j++) {
    //             if (cmdtree.tokens[i][j].type == "cmd") {
    //                 continue;
    //             }

    //             let newtree = JSON.parse(JSON.stringify(cmdtree));

    //             // find first unpopulated expression in the tree
    //             let exp_match = next_unpopulated_expression(newtree.command, newtree.tokens[i][j].type);

    //             if (!exp_match) continue; // could not match (happens if we are placing an exp and only vars are left)

    //             // populate the expression
    //             for(const prop in newtree.tokens[i][j]) {
    //                 exp_match[prop] = newtree.tokens[i][j][prop];
    //             }
    //             newtree.tokens.splice(i, 1);
    //             populate_tree_with_expressions(newtree, built_lines)
    //         }
    //     }
    // }

    // const create_tree_for_each_cmd = (linenode) => {
    //     /*
    //      * Returns an array of objects. Each obj has:
    //      * * param property: the cmd with all possible interpretations
    //      * * tokens property: all tokens that are not part of that command
    //      */

    //     let cmd_trees = [];

    //     // first, construct one with each possible command
    //     for (let i = 0; i < linenode.tokens.length; i++) {

    //         // new_tree, like linenode, is an array of tokens with each token 
    //         // containing ALL POSSIBLE interpretations of that token
    //         let new_tree = JSON.parse(JSON.stringify(linenode));

    //         // loop through new_tree and consider each token as a command
    //         while (new_tree.tokens[i].findIndex(t => t.type == "cmd") !== -1) {
    //             let cmd_loc = new_tree.tokens[i].findIndex(t => t.type == "cmd");

    //             new_tree.tokens[i].isCmd = true;
    //             new_tree.command = new_tree.tokens[i][cmd_loc];
    //             new_tree.tokens[i].splice(cmd_loc, 1);

    //             // make a copy to save to the cmd_tree list (this is is necessary in case the symbol has more than one command)
    //             let cmd_tree = JSON.parse(JSON.stringify(new_tree));

    //             // in the copy, we clear all other possible interpretations of the command symbol, so token list is ONLY expressions, and cmd moved to its own property
    //             cmd_tree.tokens.splice(i, 1);

    //             // DEBUG
    //             // console.log(JSON.stringify(cmd_tree, 1));

    //             cmd_trees.push(cmd_tree);
    //         }
    //     }
    //     return cmd_trees;
    // };

    // const add_variables = (linenode) => {
    //     let line = [...linenode.line];
    //     for(let i = 0; i < line.length; i++) {
    //         let sym = line[i];
    //         if (sym in Valence.lexicon.descriptions)
    //             linenode.tokens[i].push({
    //                 name: sym,
    //                 type: "var",
    //                 children: [],
    //                 js: Valence.lexicon.descriptions[sym].key
    //             });
    //     }
    // }

    const build_trees = (linenode) => {
        // add_variables(linenode);

        linenode.built = true;
        return built_lines;
    }

    // const build_trees_old = (linenode) => {
    //     add_variables(linenode);

    //     let built_lines = [];

    //     let cmd_trees = create_tree_for_each_cmd(linenode);

    //     if (cmd_trees.length == 0) {
    //         throw new Error("Sorry, there are no valid interpretations of this line of code");
    //     }

    //     for(let i = 0; i < cmd_trees.length; i++) {
    //         populate_tree_with_expressions(cmd_trees[i], built_lines);
    //     }
    //     linenode.built = true;

    //     return built_lines;
    // }

    // const find_child = (node, role, which) => {
    //     // which = which instance: first, second, third, etc

    //     let found = 0;
    //     if (node.children) {
    //         for (let i = 0; i < node.children.length; i++) 
    //             if (node.children[i].role == role) 
    //                 if (++found == which) return node.children[i];
    //     }
    // }

    const transpile_js = (line_tree) => {

        let retstr = line_tree.js;

        let max_expressions = 10;

        for (let i = 1; i <= max_expressions; i++) {
            let expnode = find_child(line_tree, "exp", i);
            if (expnode) {
                retstr = retstr.replaceAll(`{exp${i > 1 ? i : ''}}`, transpile_js(expnode));
            }
        }

        let varnode = find_child(line_tree, "var", 1);
        if (varnode) {
            retstr = retstr.replaceAll('{var}', varnode.js);
        }
        return retstr;
    }

    const parse_brackets = (line) => {
        let open_bracket = [];
        for(let i = 0; i < line.tokens.length; i++) {
            let first_interpretation = line.tokens[i][0];
            switch(first_interpretation.type) {
                case "comma":
                    // nothing done yet with commas
                    continue;
                case "open_bracket":
                    open_bracket.push(i);
                    continue;
                case "close_bracket":
                    if (open_bracket.length == 0) {
                        throw new Error("Unmatched brackets");
                    }
                    oploc = open_bracket.pop();
                    op = line.tokens[oploc][0];
                    op.type = "subexpression";
                    op.children = line.tokens.slice(oploc+1, i);
                    line.tokens = line.tokens.slice(0, oploc+1).concat(line.tokens.slice(i+1));
                    // need to restart, as everything in the array has shifted
                    open_bracket = [];
                    i = 0;
                    break;
            }
        }
        return line;
    }

    return (function () {
        // public functions

        this.parse = (input, complete) => {

            let start_time = Date.now();

            if (complete) {
                let lines = input.split(/\r?\n/);
                program = lines.map(s => scanner.evaluate_line(s));
            } else {
                program.push(scanner.evaluate_line(input));
            }

            // first put the nodes in a tree for each line
            for (let a = 0; a < program.length; a++) {
                if (!program[a].built) {
                    program[a] = parse_brackets(program[a]);
                }
            }

            for (let i = 0; i < program.length; i++) {
                // all the possible interpretations of this line of code, parsed
                let line_trees = [];

                if (!program[i].built) {
                    // build out possibile ASTs for the line
                    line_trees = build_trees(program[i]);

                    // DEBUG: print all the matched combinations
                    // for(let j = 0; j < line_trees.length; j++)
                    //     console.log(JSON.stringify(line_trees[j]));

                    // DEBUG: print all matched combinations as javascript / psuedocode
                    let outstr = program[i].line + "\n\n";
                    for(let j = 0; j < line_trees.length; j++)
                        outstr += line_trees[j].full_js + "\n";
                    
                    complete_time = Date.now();
                    seconds = Math.floor(complete_time/1000) - Math.floor(start_time/1000);
                    if (seconds > 0 ) {
                        outstr += `\ncompleted in ${seconds} seconds`;
                    } else {
                        outstr += `\ncompleted in ${complete_time - start_time} milliseconds`;
                    }

                    if (typeof module !== 'undefined' && fs) {
                        fs.writeFile(`out/${outfilename}.txt`, outstr, err => {
                            if (err) {
                                console.error(err);
                            }
                        });
                    }
                    console.log(outstr);
                }
            }
        }

        this.program_state = () => {
           return JSON.stringify(program);
        }
    });
})();

Valence.parser = new parser();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.parser;
}


// entry point for testing for the moment

// Valence.parser.parse("𐅄Hello, World!",false);
// Valence.parser.parse("𐆌𐆌1",false);
// Valence.parser.parse("𐆇𐆌1",false);

// let f = Function("while(true){}")

// FizzBuzz
// Valence.parser.parse("𐆌𐅄100",false);
// Valence.parser.parse("𐆁𐅄",false);

Valence.parser.parse("𐅶[𐅾𐆋,𐅄]𐆁𐅄test",false);
