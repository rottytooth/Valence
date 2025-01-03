if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    Valence.lexicon = require('./valence.lexicon');
    scanner = require('./valence.scanner').scanner;
}

const parser = (function() {
    
    var program = [];

    var skip_block_building = false;

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
        if (!Array.isArray(tree)) {
            for (let i = 0; i < tree.params.length; i++) {
                let r = find_child_in_tree(tree.params[i], num);
                if (r) return r;
            }
        }
        return null;
    }

    const check_complete = (tree) => {
        if (Object.hasOwn(tree, 'children')) {
            return false;
        }
        if (Array.isArray(tree) && tree.length > 0) {
            return false;
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
        // makes one child the operator and all the other 
        // children its parameters

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

    const resolve_param_end_node = (line, ast, node, param_num, original_idx) => {
        // an end node has special potential_readings: a var or digit can be an exp

        if (!(node.params.length > param_num && node.params[param_num].params.length === 0)) 
            return;

        if (node.params[param_num].reading.length === 1) {
            node.params[param_num].reading = node.params[param_num].reading[0];
        }

        let reading_to_assign = null;
        if (!Array.isArray(node.params[param_num].reading)) {
            reading_to_assign = node.params[param_num].reading
        } else {
            reading_to_assign = node.params[param_num].reading.filter(x => x.type === node.reading.params[param_num].type);

            // if there is no exp, then duplicate the ast, one with var, the other with int
            if (!reading_to_assign || reading_to_assign.length === 0) {
                switch(node.reading.params[param_num].type) {
                case "var":
                case "digit":
                    // if it's a var or a digit, adopt that reading
                    reading_to_assign = node.params[param_num].reading.filter(x => x.type === node.reading.params[param_num].type);
                    break;
                case "exp":
                    // otherwise, split the ast into two, one for each reading
                    if (line.asts.length > Valence.parser.MAX_ASTS) {
                        throw {name : "SyntaxError", message : "SyntaxError: Too many interpretations of this line of code; probably stuck in an infinite loop"};
                    }
                    // assign the var reading to the existing ast
                    reading_to_assign = node.params[param_num].reading.filter(x => x.type === "var");

                    // dupe the ast and assign digit to the other
                    new_tree = JSON.parse(JSON.stringify(ast));
                    new_tree.forked_from = original_idx;
                    line.asts.push(new_tree);
                    new_token = find_child_in_tree(new_tree, node.id);
                    new_token.params[param_num].reading = new_token.params[param_num].reading.filter(x => x.type === "digit")[0];
                    break;
                }
            }
        }
        if (Array.isArray(reading_to_assign)) reading_to_assign = reading_to_assign[0];
        node.params[param_num].reading = reading_to_assign;
    }

    const interpret_node = (line, ast, node, isCommand, original_idx) => {
        if (!Object.hasOwn(node, 'potential_readings')) {
            return;
        }
        if (node.reading == undefined || (Array.isArray(node.reading) && node.reading.length !== 1)) {
            // if reading is already resolved, don't do this
            if (isCommand) {
                node.reading = node.potential_readings.filter(x => x.type === "cmd");
            } else {
                node.reading = node.potential_readings.filter(x => x.type !== "cmd");
            }
        }

        if (node.params === undefined) {
            node.params = [];
        }

        for (let i = 0; i < node.params.length; i++) {
            interpret_node(line, ast, node.params[i], false, original_idx);
        }

        // filter by number of params
        if (Array.isArray(node.reading)) {
            node.reading = node.reading.filter(
                x => x.params.length === node.params.length);

            // if only one reading is left, de-arrayify it
            if (node.reading.length === 1) {
                node.reading = node.reading[0];
            }
        }
        
        // if any of the children are end nodes, resolve them
        for (let j = 0; j < 2; j++) {
            resolve_param_end_node(line, ast, node, j, original_idx);
        }

        if (node.params.length > 0 && Array.isArray(node.params[0].reading)) {
            throw new {name: "InternalError", message:`Could not resolve reading for sign ${node.params[0].symbol}`};
        }
        if (node.params.length == 2 && Array.isArray(node.params[1].reading)) {
            throw new {name: "InternalError", message:`Could not resolve reading for sign ${node.params[1].symbol}`};
        }
    }

    const build_asts = (line, intpt, token = intpt) => {
        // build all valid ASTs for a given line

        if (!Object.hasOwn(token, 'params')) {
            token.params = [];
        }

        // A token will have either children or params
        // CHILDREN are not yet grouped, may have brackets
        // PARAMS are children broken down into parameters to the token

        // FIRST we deal with any children, moving them to params
        if ((!Object.hasOwn(token, 'children') || token.children.length === 0) 
            && token.params.length === 0) {
            
            if (check_complete(intpt)) {
                intpt.complete = true;
            }
            return;
        }
        if (Object.hasOwn(token, 'children') && token.children !== undefined) {
            // if we get this far, there are multiple children or params to break out

            // check for a command that has no params
            if (token == intpt // is a command
                && token.children.length == 1 // has no siblings
                // has no children:
                && (token.children[0].children === undefined || token.children[0].children.length === 0)
                && (token.children[0].params === undefined || token.children[0].params.length === 0)
            ) {
                token.children[0].complete = true; // forcing this; as we know there are no other nodes to check
                line.asts.push(token.children[0]);
                return;
            }

            for (let i = 0; i < token.children.length - 1; i++) {
                if (token.children[i].symbol == "[") {
                    continue; // can't have bracket as command
                }
                // copy the tree
                // FIXME: Why does this always duplicate, when below (for params) we test for whether its nec with split_yet? Don't want to make this more complex unnecessarily. Perhaps the unfinished are just being dropped as incomplete anyway
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

                build_asts(line, new_tree, new_token);
            }

        }
        // SECOND, process those params: 
        // * either they are already single nodes and should be sent to this func
        // * or they are arrays
        //   * if so, reorganize into params, for each valid command and split this ast into two
        for (let i = 0; i < token.params.length; i++) { 
            if (!Array.isArray(token.params[i])) {
                build_asts(line, intpt, token.params[i]);
                continue;
            }
            if (token.params[i].length == 1) {
                // single element gets broken out of array
                token.params[i] = token.params[i][0];
                build_asts(line, intpt, token.params[i]);
                continue;
            }

            let split_yet = false;
            for(let j = 0; j < token.params[i].length - 1; j++) {
                // if more than one, we need to try each (but the last) as the parent node (for cmd or exp). For each possible parent, copy the ast, make that the parent, take the preceeding nodes its first param and its following siblings its second
                if (token.params[i][j].symbol == "[") {
                    continue; // can't have bracket as operator
                }

                if (!split_yet) {
                    split_yet = true;

                    token.params[i][j].params = children_to_params(token.params[i], j);
                    token.params[i] = token.params[i][j];
                    delete token.children;

                    build_asts(line, intpt, token); // rerun new token
                } else {    
                    new_tree = JSON.parse(JSON.stringify(intpt));
                    new_token = find_child_in_tree(new_tree, token.id);
                    new_token.params[i][j].params = children_to_params(new_token.params[i], j);
                    new_token.params[i] = new_token.params[i][j];
                    delete new_token.children;

                    line.asts.push(new_tree);

                    build_asts(line, new_tree, new_token); // rerun new token after it was reorganized
                }
            }
        }
    }

    // organize the line into a tree based on existing brackets
    // and number (give IDs to) the symbols for later processing
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
                        throw new {name: "SyntaxError", message:"Unmatched brackets"};
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
        if (line.tokens.length > 1 || line.tokens.symbol != "[") {
            line.tokens = {type: "open_bracket", symbol: "[", children: JSON.parse(JSON.stringify(line.tokens)), id: 0};
        }

        return line;
    }


    const transpile_ast_to_js = (ast, use_pseudo) => {
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
    
            let replacement = transpile_ast_to_js(ast.params[i], use_pseudo);
            localstr = localstr.replaceAll("{"+name+"}", replacement);
        }
        return localstr;
    };

    const generate_transpilations = (parsed_prog) => {
    
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
                parsed_prog[i].asts[j].reading.js = transpile_ast_to_js(parsed_prog[i].asts[j], false);
                parsed_prog[i].asts[j].reading.pseudo = transpile_ast_to_js(parsed_prog[i].asts[j], true);
                retstr += parsed_prog[i].asts[j].reading.pseudo + "\n";
            }
        }
        parsed_prog.log = retstr;
        return parsed_prog;
    };

    const parse_to_proglist = (program) => {
        // from a program, generates list of interable programs
        let parsed = generate_transpilations(program);
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
                        throw new {name: "SyntaxError", message:"Too many ASTs"};
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
    
        find_blocks(progs);
        return progs;
    };

   const find_blocks = (progs) => {
        // mark while/if blocks to where they close 
        // this both modifies progs in place and returns it
        for (let i = 0; i < progs.length; i++) {
            var stack = [];
            for (let ln = 0; ln < progs[i].length; ln++) {

                if (["if", "while", "for"].includes(progs[i][ln].reading.name)) {
                    stack.push({ line: ln, cmd: progs[i][ln].reading.name});
                }
                else if (["else_if", "else"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0 || (stack[stack.length-1].cmd !== "if" && stack[stack.length-1].cmd !== "else_if")) {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    } else {
                        let start = stack.pop();
                        progs[i][start.line].end = ln;
                        progs[i][ln].start = start.line;
                        stack.push({ line: ln, cmd: progs[i][ln].reading.name});
                    }
                }
                else if (["end_block"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0) {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    } else {
                        let start = stack.pop();
                        progs[i][start.line].end = ln;
                        progs[i][ln].start = start.line;
                    }
                }
            }
            if (stack.length > 0) {
                progs[i].failed = true;
                progs[i].bad_line = stack[stack.length-1].line;
            }
        }
        return progs;
    };


    return (function () {
        // public functions

        // testing
        this._testing = {
            _generate_transpilations: generate_transpilations,

            _parse_to_proglist: parse_to_proglist,

            _skip_block_building: skip_block_building
        },

        this.print_ast = (ast, inc_markers = false) => {
            // print the ast on a single line with brackets

            let retstr = "";
            let retmarkers = "";

            let code = ast.reading.type[0];

            if (ast.params.length == 2) {
                let nd = this.print_ast(ast.params[0], true);
                retstr += `[${nd[0]}]`;
                retmarkers += `${code}${nd[1]}${code}`
            }
            retstr += ast.symbol;
            retmarkers += code;
            if (ast.params.length == 1) {
                let nd = this.print_ast(ast.params[0], true);
                retstr += `[${nd[0]}]`;
                retmarkers += `${code}${nd[1]}${code}`
            }
            if (ast.params.length == 2) {
                let nd = this.print_ast(ast.params[1], true);
                retstr += `[${nd[0]}]`;
                retmarkers += `${code}${nd[1]}${code}`
            }
            if (inc_markers) {
                return [retstr, retmarkers];
            }
            return retstr;
        }

        this.print_ast_detail = (ast, level = 0) => {
            // draw the ast as a tree, indented by level
            retstr = "";
            if (level == 0) {
                retstr += ast.line + "\n"; 
            }
            for(let i = 0; i < level; i++) {
                retstr += "\t";
            }
            retstr += `${ast.symbol} ${ast.reading.name} id:${ast.id}\n`;
            for(let j = 0; j < ast.params.length; j++) {
                retstr += this.print_ast_detail(ast.params[j], level + 1);
            }
            return retstr;
        }

        this.parse = (input, complete) => {
            // complete: if true, parse the entire input as complete multi-line program
            // if false, generate asts for a single line but don't attempt to match brackets or perform other program-wide analysis

            program = [];

            let start_time = Date.now();

            if (complete) {
                // split into lines and evaluate each
                let lines = input.split(/\r?\n/);
                program = lines.map((s, idx) => scanner.evaluate_line(s, false, idx));
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
                    
                    // build out program[i].asts
                    build_asts(program[i], program[i].asts[0]);
                    program[i].asts = program[i].asts.slice(1); // remove the original interpretation

                    let ast_count = program[i].asts.length;
                    for (let chk = 0; chk < i; chk++) {
                        ast_count *= program[chk].asts.length;
                        if (ast_count > Valence.parser.MAX_TOTAL_ASTS) {
                            throw {name : "SyntaxError", message : "SyntaxError: This program generates too many interpretations"};
                        }
                    }

                    // remove incomplete ASTs
                    program[i].asts = program[i].asts.filter(x => x.complete);
                    // remove complete, which has no meaning after this
                    for (let j = 0; j < program[i].asts.length; j++) {
                        delete program[i].asts[j].complete;
                    }

                    // fill out the reading field of each ast
                    // asts will multiply when an end node can be read in multiple ways
                    for (let j = 0; j < program[i].asts.length; j++) {
                        interpret_node(program[i], program[i].asts[j], program[i].asts[j], true, j);

                        if (program[i].asts[j].reading !== undefined && program[i].asts[j].reading.length !== 0) {
                            retset = this.print_ast(program[i].asts[j], true);
                            program[i].asts[j].line = retset[0];
                            program[i].asts[j].line_markers = retset[1];
                        }

                        // debug: print the tree
                        // console.log(this.print_ast_detail(program[i].asts[j]));
                    }

                    // filter out those without valid readings
                    program[i].asts = program[i].asts.filter(x => x.reading !== undefined && x.reading.length !== 0);
                    
                    complete_time = Date.now();
                    seconds = Math.floor(complete_time/1000) - Math.floor(start_time/1000);
                    if (seconds > 0 ) {
                        outstr = `\parsed in ${seconds} seconds`;
                    } else {
                        outstr = `\parsed in ${complete_time - start_time} milliseconds`;
                    }

                    console.log(outstr);
                }
            }

            if (complete) {
                // if set to complete, mark the failured interpretations and match the blocks
                let progs = parse_to_proglist(program);

                if (!Valence.parser._testing._skip_block_building) {
                    program = find_blocks(progs);
                }
            }
     
            return program;
        }

        this.parse_program = (program, to_file=false, outfile = null) => {
            // parse a program from text, output to either screen or a file
            if (!to_file) {
                parse_and_print(program);
                return;
            }
            if (!outfile) {
                outfile = `output/${program}.txt`;
            }
            fs.writeFile(outfile, generate_transpilations(program, true).log, (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
        };
    
        this.parse_file = (infile, to_file=false, outfile = null) => {
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
    });
})();

Valence.parser = new parser();

Valence.parser.MAX_ASTS = 200;

Valence.parser.MAX_TOTAL_ASTS = 300;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.parser;
}
