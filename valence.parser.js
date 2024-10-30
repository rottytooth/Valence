const { start } = require('node:repl');
const fs = require('node:fs'); // temporary, for testing

const outfilename = "test4";

if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    Valence.lexicon = require('./valence.lexicon');
    scanner = require('./valence.scanner');
}

parser = (function() {
    
    var program = [];

    const populate_tree_with_expressions = (cmdtree, built_lines) => {
        // check if completely populated
        if (!next_unpopulated_expression(cmdtree.command)) {
            // check if all tokens are used -- if so, keep as completed
            if (cmdtree.tokens.length == 0) {
                cmdtree.full_js = transpile_js(cmdtree.command);
                cmdtree.built = true;

                if (!built_lines.find(x => x.full_js == cmdtree.full_js))
                    built_lines.push(cmdtree);
            }
            return;
        }
        // run through each possible expression to use
        for (let i = 0; i < cmdtree.tokens.length; i++) {

            // if (cmdtree.command.children.length == 0) continue;

            for(let j = 0; j < cmdtree.tokens[i].length; j++) {
                if (cmdtree.tokens[i][j].type == "cmd") {
                    continue;
                }

                let newtree = JSON.parse(JSON.stringify(cmdtree));

                // find first unpopulated expression in the tree
                let exp_match = next_unpopulated_expression(newtree.command, newtree.tokens[i][j].type);

                if (!exp_match) continue; // could not match (happens if we are placing an exp and only vars are left)

                // populate the expression
                for(const prop in newtree.tokens[i][j]) {
                    exp_match[prop] = newtree.tokens[i][j][prop];
                }
                newtree.tokens.splice(i, 1);
                populate_tree_with_expressions(newtree, built_lines)
            }
        }
    }

    const length_non_brackets = (x) => { 
        let sh = x.line.replace(/\[/g,"").replace(/\]/g,""); 
        return Array.from(sh.split(/[\ufe00-\ufe0f]/).join("")).length
    }
    const length_non_brackets_array = (x) => {return x.reduce((acc, val) => acc + (val == "]" || val == "[" ? 0 : 1), 0); }


    // checks if complete and loads to line.interpretations if so
    const check_complete = (line, path) => {
        if ((length_non_brackets_array(path) 
            == length_non_brackets(line)) &&
            (path.filter(x => x=="[").length
            == path.filter(x => x=="]").length)) {

            if (!Object.hasOwn(line, "interpretations")) {
                line.interpretations = [];
            }
            line.interpretations.push(path);
            return true;
        }
        return false;
    }

    const build_asts = (line, tokens, curr_path = []) => {
        // needs to multiply tokens, building out all the possibilities

        if (tokens.length == 1) {
            curr_path.push(tokens[0].number);
            if (check_complete(line, curr_path)) {
                return null;
            }
        }
        for (let i = 0; i < tokens.length - 1; i++) {
            if (tokens[i].symbol == "[") {
                continue; // can't have bracket as command
            }
            path = [...curr_path];

            if (i > 0) {
                path.push("[");            
                path = build_asts(line, tokens.slice(0,i), path);
                path.push("]");            
            }
            path.push(tokens[i].number);
            if (tokens.length == i+2 && tokens[i+1].type == "open_bracket") {
                path.push("[");
                path = build_asts(line, tokens[i+1].children, path);
                path.push("]");
            } else {
                path.push("[");
                path = build_asts(line, tokens.slice(i+1), path);
                path.push("]");
            }
            if (check_complete(line,path)) {
                return null;
            }
        }
        return curr_path;
    }

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

    // organize the line into a tree based on existing brackets
    // and number the symbols for later processing
    const parse_brackets = (line) => {
        let open_bracket = -1;
        let symbol_count = 0;
        for(let i = 0; i < line.tokens.length; i++) {
            switch(line.tokens[i].type) {
                case "open_bracket":
                    if (!Object.hasOwn(line.tokens[i], 'children')) {
                        // if not yet populated with children
                        open_bracket = i;
                        continue;
                    }
                    break;
                case "close_bracket":
                    if (open_bracket == -1) {
                        throw new Error("Unmatched brackets");
                    }
                    op = line.tokens[open_bracket];
                    op.children = line.tokens.slice(open_bracket + 1, i);
                    line.tokens = line.tokens.slice(0, open_bracket + 1).concat(line.tokens.slice(i + 1));

                    // need to restart, as everything in the array has shifted
                    open_bracket = -1;
                    i = 0;
                    break;
                case "symbol":
                    if (!Object.hasOwn(line.tokens[i], 'number')) {
                        line.tokens[i].number = symbol_count;
                        symbol_count++;
                    }
            }
        }
        return line;
    }

    return (function () {
        // public functions

        this.parse = (input, complete) => {

            let start_time = Date.now();

            if (complete) {
                // split into lines and evaluate each
                let lines = input.split(/\r?\n/);
                program = lines.map(s => scanner.evaluate_line(s));
            } else {
                // evaluate the new line and push to the program
                program.push(scanner.evaluate_line(input));
            }

            // first put the nodes in a tree for each line
            for (let a = 0; a < program.length; a++) {
                if (!program[a].built) {
                    program[a] = parse_brackets(program[a]);
                }
            }

            const programs = []; // list of combatible interpretations of each line

            for (let i = 0; i < program.length; i++) { // each line of code

                if (!program[i].built) {
                    // build out possibile ASTs
                    build_asts(program[i], program[i].tokens);
                    print(program[i].interpretations);

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

// Valence.parser.parse("𐆇[𐆇𐆇[𐆊𐅶]]",false);
Valence.parser.parse("𐆇𐆊𐅶",false);