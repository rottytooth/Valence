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

    const find_child_in_tree = (tree, num) => {
        // depth-first search for a child with a specific id
        if (tree.id === num) {
            return tree;
        }
        if (Object.hasOwn(tree, 'children')) {
            for (let i = 0; i < tree.children.length; i++) {
                let r = find_child_in_tree(tree.children[i], num);
                if (r) return r;
            }
        }
        for (let i = 0; i < tree.params.length; i++) {
            let r = find_child_in_tree(tree.params[i], num);
            if (r) return r;
        }
        return null;
    }

    const check_complete = (tree) => {
        if (Object.hasOwn(tree, 'children')) {
            return false;
        }
        if (Array.isArray(tree)) {
            return false;
            // for (let i = 0; i < tree[i]; i++) {
            //     let complete = check_complete(tree[i]);
            //     if (!complete) return false;
            // }
        }
        if (Object.hasOwn(tree, 'params')) {
            for (let i = 0; i < tree.params.length; i++) {
                let complete = check_complete(tree.params[i]);
                if (!complete) return false;
            }
        }
        return true;
    }

    const children_to_params = (tokens, idx) => {
        // moves one token into place and makes the others its parameters
        
        pre_fix = tokens.slice(0,idx);
        post_fix = tokens.slice(idx+1);

        if (pre_fix.length == 1 && pre_fix[0].symbol == "[") {
            pre_fix = pre_fix[0].children;
        }
        if (post_fix.length == 1 && post_fix[0].symbol == "[") {
            post_fix = post_fix[0].children;
        }

        if (pre_fix.length == 0) {  
            return [post_fix]; //  param 1
        } else {
            return [pre_fix, post_fix]; // params 1 and 2
        }
    }

    const build_asts = (line, intpt, token = intpt) => {
        // build all valid ASTs for a given line

        if (!Object.hasOwn(token, 'params')) {
            token.params = [];
        }

        if ((!Object.hasOwn(token, 'children') || token.children.length === 0) 
            && token.params.length === 0) {
            
            if (check_complete(intpt)) {
                intpt.complete = true;
            }
            return;
        }
        if (Object.hasOwn(token, 'children') && token.children.length === 1 && token.children[0].symbol != "[") {
            token.children = token.children[0].children;
        }
        if (Object.hasOwn(token, 'children') && token.params.length === 0 && token.children.length === 1 && token.children[0].symbol != "[") {
            // if there's only one child, make it the first parameter
            token.params = [token.children[0]];
            build_asts(line, intpt, token.params[0]);
            return; 
        }
        if (Object.hasOwn(token, 'children')) {
        // if we get this far, there are multiple children or params to break out
            for (let i = 0; i < token.children.length - 1; i++) {
                if (token.children[i].symbol == "[") {
                    continue; // can't have bracket as command
                }
                // copy the tree
                new_tree = JSON.parse(JSON.stringify(intpt));
                new_token = find_child_in_tree(new_tree, token.id);
                new_token.children[i].params = children_to_params(new_token.children, i);
                new_token.params.push(new_token.children[i]);
                delete new_token.children;

                // if this list begins with a bracket, remove it
                if (new_tree.symbol == "[") {
                    new_tree = new_tree.params[0];
                }
                line.asts.push(new_tree);

                for (let i = 0; i < new_token.params.length; i++) {
                    build_asts(line, new_tree, new_token.params[i]);
                }        
            }
        }
        for (let i = 0; i < token.params.length; i++) { 
            if (Array.isArray(token.params[i])) {
                if (token.params[i].length == 1) {
                    token.params[i] = token.params[i][0];
                    build_asts(line, intpt, token.params[i]);
                }
                for(let j = 0; j < token.params[i].length - 1; j++) {
                    new_tree = JSON.parse(JSON.stringify(intpt));
                    new_token = find_child_in_tree(new_tree, token.id);
                    new_token.params[i][j].params = children_to_params(new_token.params[i], j);
                    new_token.params[i] = new_token.params[i][j];
                    delete new_token.children;

                    line.asts.push(new_tree);

                    for (let i = 0; i < new_token.params.length; i++) {
                        build_asts(line, new_tree, new_token.params[i]);
                    }        
                }
            } else {
                build_asts(line, intpt, token.params[i]);
            }
        }
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
    const parse_brackets_and_number_nodes = (line) => {
        let open_bracket = -1;
        let symbol_count = 1; // parent folder will be 0

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

                    if (!Object.hasOwn(op, 'id')) {
                        op.id = symbol_count;
                        symbol_count++;
                    }

                    // need to restart, as everything in the array has shifted
                    open_bracket = -1;
                    i = 0;
                    break;
                case "symbol":
                    if (!Object.hasOwn(line.tokens[i], 'id')) {
                        line.tokens[i].id = symbol_count;
                        symbol_count++;
                    }
            }
        }

        // if there is not a single parent at top of chain, add it here
        if (line.tokens.length > 1 || line.tokens[0].symbol != "[") {
            line.tokens = {type: "open_bracket", symbol: "[", children: JSON.parse(JSON.stringify(line.tokens)), id: 0};
        }

        return line;
    }

    const print_ast = (ast) => {
        retstr = "";
        if (ast.params.length == 2) {
            retstr += `[${print_ast(ast.params[0], retstr)}]`;
        }
        retstr += ast.symbol;
        if (ast.params.length == 1) {
            retstr += `[${print_ast(ast.params[0], retstr)}]`;
        }
        if (ast.params.length == 2) {
            retstr += `[${print_ast(ast.params[1], retstr)}]`;
        }
        return retstr;
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
                    program[a] = parse_brackets_and_number_nodes(program[a]);
                }
            }

            const programs = []; // list of combatible asts of each line

            for (let i = 0; i < program.length; i++) { // each line of code

                if (!program[i].built) {
                    // build out possibile ASTs

                    // set up initial conditions for building out the ASTs
                    if (!Object.hasOwn(program[i], "asts")) {
                        program[i].asts = [];
                    }
                    let token = JSON.parse(JSON.stringify(program[i].tokens));
                    program[i].asts.push(token);
                    
                    build_asts(program[i], program[i].asts[0]);
                    program[i].asts = program[i].asts.slice(1); // remove the original interpretation

                    // remove incomplete ASTs
                    program[i].asts = program[i].asts.filter(x => x.complete);

                    // print results
                    for (let j = 0; j < program[i].asts.length; j++) {
                        console.log(print_ast(program[i].asts[j]));
                    }

                    

                    
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

Valence.parser.parse("𐆇[𐆇𐆇[𐆊𐅶]]",false);
// Valence.parser.parse("𐆇𐆊𐅶",false);