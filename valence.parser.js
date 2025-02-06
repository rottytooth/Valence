if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    const { start } = require('node:repl');
    const fs = require('node:fs'); // temporary, for testing

    Valence.lexicon = require('./valence.lexicon');
    scanner = require('./valence.scanner').scanner;
}

const parser = (function() {

    var DEBUG = false;
    
    var program = [];

    var skip_block_building = false;

    const print_ast_detail = (ast, level = 0) => {
        // draw the ast as a tree, indented by level
        let retstr = "";
        if (level == 0 && Object.hasOwn(ast, "line")) {
            retstr += ast.line + "\n"; 
        }
        for(let i = 0; i < level; i++) {
            retstr += "\t";
        }
        retstr += `${ast.symbol} ${(Object.hasOwn(ast, "reading") ? ast.reading.name : "")} id:${ast.id}\n`;
        if (Object.hasOwn(ast, 'params')) {
            for(let j = 0; j < ast.params.length; j++) {
                retstr += print_ast_detail(ast.params[j], level + 1);
            }
        }
        return retstr;
    }

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
        if (Object.hasOwn(tree, 'params')) {
            for (let i = 0; i < tree.params.length; i++) {
                let r = find_child_in_tree(tree.params[i], num);
                if (r) return r;
            }
        }
        return null;
    }

    const find_ids_in_tree = (sibs, retset) => {
        // return all ids in an un-parsed tree (meaning a tree only in terms of branckets), excluding the brackets themselves
        if (retset === undefined) {
            retset = [];
        }
        for(let i = 0; i < sibs.length; i++) {
            if (sibs[i].symbol === '[') {
                retset = find_ids_in_tree(sibs[i].children, retset);
            } else {
                retset.push(sibs[i].id);
            }
        }
        return retset;
    }

    const check_complete = (node, ids_to_place, ids_placed) => {
        if (!(ids_placed.includes(node.id))) {
            ids_placed.push(node.id);
        }
        if (Object.hasOwn(node, 'params')) {
            for (let i = 0; i < node.params.length; i++) {
                check_complete(node.params[i], ids_to_place, ids_placed);
            }
        }
        if (ids_to_place.filter(x => !ids_placed.includes(x)).length === 0) {
            return true;
        }
        return false;
    }

    // build all valid ASTs for a given line and add to line.asts
    const build_trees = (
        line, // to add to asts list
        parentnode, // the new parent, chosen among siblings
        parentidx,  // index of the new parent
        siblings, // the parent and its siblings 
        tree, // the base of the current tree
        ids_to_place // the whole set of ids to place
    ) => {

        if (!tree) {
            // if not provided, assume we are at the top of the tree
            tree = parentnode;
            ids_to_place = find_ids_in_tree(siblings);
        }

        if (DEBUG) {
            console.log(print_ast_detail(tree));
            console.log(`siblings: ${siblings.map(x => " " + x.symbol + " " + x.id)}\n`);                    
        }

        if (siblings.length == 0 || (siblings.length == 1 && siblings[0].id == parentnode.id)) {
            if (check_complete(tree, ids_to_place, [])) {
                if (!line.asts.includes(tree)) {
                    line.asts.push(tree);
                }
            }
            return tree;
        }

        if (!Object.hasOwn(parentnode, 'params')) {
            parentnode.params = [];
        }

        let param_one_nodes = [];
        let param_two_nodes = [];

        if (parentidx > 0) {
            param_one_nodes = siblings.slice(0, parentidx);
            param_two_nodes = siblings.slice(parentidx + 1);
        } else {
            param_one_nodes = siblings.slice(parentidx + 1);
            param_two_nodes = [];
        }

        if (param_one_nodes.length == 1 && param_one_nodes[0].symbol == "[") {
            param_one_nodes = param_one_nodes[0].children;
        }
        if (param_two_nodes.length == 1 && param_two_nodes[0].symbol == "[") {
            param_two_nodes = param_two_nodes[0].children;
        }

        for (let i = 0; i < 1 || i < param_one_nodes.length - 1; i++) {
            if (param_one_nodes[i].symbol == '[')
                continue;

            tree = JSON.parse(JSON.stringify(tree));
            parentnode = find_child_in_tree(tree, parentnode.id);
            parentnode.params = [];

            parentnode.params.push(param_one_nodes[i]);

            try {
                tree = build_trees(line, param_one_nodes[i], i, param_one_nodes, tree, ids_to_place);
            } catch(err) {
                console.error("InternalError in build_trees() call");
                console.error(print_ast_detail(tree));
                console.error(`ID: ${parentnode.id}`);
                console.error(err);
            }
            parentnode = find_child_in_tree(tree, parentnode.id); // in case we are in a new copy

            let j_split = false;
            let tree_bkup = JSON.parse(JSON.stringify(tree));
            let parentnode_bkup = find_child_in_tree(tree_bkup, parentnode.id);

            // for each possible first, find the second
            for (let j = 0; param_two_nodes.length > 0 && (j < 1 || j < param_two_nodes.length - 1); j++) {
                
                if (param_two_nodes[j].symbol == '[')
                    continue;

                if (j_split) {
                    tree = tree_bkup;
                    parentnode = parentnode_bkup;
                }
                j_split = true;

                parentnode.params.push(param_two_nodes[j]);
                try {
                    tree = build_trees(line, param_two_nodes[j], j, param_two_nodes, tree, ids_to_place);
                } catch(err) {
                    console.error("InternalError in build_trees() call");
                    console.error(print_ast_detail(tree));
                    console.error(`ID: ${parentnode.id}`);
                    console.error(err);
                }
                parentnode = find_child_in_tree(tree, parentnode.id); // in case we are in a new copy
            }
        }
        return tree;
    }

    // organize the line into a tree based on existing brackets
    // and number (give IDs to) the symbols for later processing
    const parse_brackets_and_id_nodes = (line) => {
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
                        throw {name: "SyntaxError", message:"Unmatched brackets"};
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
                    i = -1;
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

    const resolve_param_end_node = (line, ast, node, param_num, original_idx) => {
        // an end node has special potential_readings: a var or digit can be an exp

        if (!(node.params.length > param_num && node.params[param_num].params && node.params[param_num].params.length === 0)) 
            return;

        if (node.params[param_num].reading.length === 1) {
            node.params[param_num].reading = node.params[param_num].reading[0];
        }

        let reading_to_assign = null;
        if (!Array.isArray(node.params[param_num].reading)) {
            reading_to_assign = node.params[param_num].reading
        } else {
            reading_to_assign = node.params[param_num].reading.filter(x => x.type === node.reading.params[param_num].type);

            // if it demands var or digit, return that, otherwise split and return both
            if (!reading_to_assign || reading_to_assign.length === 0) {
                switch(node.reading.params[param_num].type) {
                case "var":
                case "digit":
                    // if it's a var or a digit, adopt that reading
                case "type":
                    // NOTE: we probably will only end up here if there is no "type" but "type" is expected
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
                    let new_tree = JSON.parse(JSON.stringify(ast));
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

        // this might happen for type of "type" for a sign that has no type value
        if (reading_to_assign === undefined) {
            throw {name: "SyntaxError", message:`No valid reading for this use of ${node.symbol}`};
        }
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
                        throw {name: "SyntaxError", message:"Too many ASTs"};
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

        // if no potential reading with the same number of params as we have, reject
        if (node.reading.length === 0 || 
            (Array.isArray(node.reading) && node.reading.filter(x => x.params.length == node.params.length) === 0) ||
            (!Array.isArray(node.reading) && node.reading.params.length !== node.params.length))
        {
            throw {name: "SyntaxError", message:`No valid reading for this use of ${node.symbol}`};
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
        
        for (let i = 0; i < node.params.length; i++) {
            interpret_node(line, ast, node.params[i], false, original_idx);
        }

        if (node.reading.length === 0) {
            throw {name: "SyntaxError", message:`No valid reading for this use of ${node.symbol}`};
        }

        // FIXME: if it's expecting meta_exp, handle here
        
        // if any of the children are end nodes, resolve them
        for (let j = 0; j < 2; j++) {
            resolve_param_end_node(line, ast, node, j, original_idx);
        }

        if (node.params.length > 0 && Array.isArray(node.params[0].reading)) {
            throw {name: "InternalError", message:`Could not resolve reading for sign ${node.params[0].symbol}`};
        }
        if (node.params.length == 2 && Array.isArray(node.params[1].reading)) {
            throw {name: "InternalError", message:`Could not resolve reading for sign ${node.params[1].symbol}`};
        }
    }

    const find_blocks = (progs) => {
        // mark while/if blocks to where they close 
        // this both modifies progs in place and returns it
        for (let i = 0; i < progs.length; i++) {
            var stack = [];
            for (let ln = 0; ln < progs[i].length; ln++) {

                if (["if", "while", "while_queue"].includes(progs[i][ln].reading.name)) {
                    stack.push({ line: ln, cmd: progs[i][ln].reading.name});
                    if (progs[i][ln].reading.name === "if") {
                        progs[i][ln].elses = [];
                    }
                }
                else if (["else_if", "else"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0 || stack[stack.length-1].cmd !== "if") {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    } else {
                        let start = stack.slice(-1)[0]; // peek
                        let recent_start = start; // most recent in chain of if / else_if
                        if (progs[i][start.line].elses.length > 0) {
                            recent_start = {line: progs[i][start.line].elses.slice(-1)[0]};
                        }
                        progs[i][recent_start.line].end = ln; // most recent ends with this
                        progs[i][ln].start = start.line; // this starts with the beginning of if chain
                        progs[i][start.line].elses.push(ln); // that if has this added to it
                    }
                }
                else if (["end_block"].includes(progs[i][ln].reading.name)) {
                    if (stack.length === 0) {
                        progs[i].failed = true;
                        progs[i].bad_line = ln;
                        break;
                    } else {
                        let start = stack.pop();
                        let recent_start = start;
                        if (Object.hasOwn(progs[i][start.line], "elses") && progs[i][start.line].elses.length > 0) {
                            recent_start = {line: progs[i][start.line].elses.slice(-1)[0]};
                        }                            
                        progs[i][ln].start = start.line;
                        progs[i][recent_start.line].end = ln;
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

        this.print_ast_detail = print_ast_detail,

        this.print_ast = (ast, inc_markers = false) => {
            // print the ast on a single line with brackets

            let retstr = "";
            let retmarkers = "";

            if (Array.isArray(ast.reading)) {
                throw {name: "InternalError", message: "reading is an array"};
            }

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

        this.parse = (input, complete, roman_chars = false) => {
            // complete: if true, parse the entire input as complete multi-line program
            // if false, generate asts for a single line but don't attempt to match brackets or perform other program-wide analysis

            program = [];

            let start_time = Date.now();

            if (complete) {
                // split into lines and evaluate each
                let lines = input.split(/\r?\n/);
                program = lines.map((s, idx) => scanner.evaluate_line(s, roman_chars, idx));
                program = program.filter(x => x.line !== "");
            } else {
                // evaluate the new line and push to the program
                let line = scanner.evaluate_line(input, roman_chars, -1);
                if (line.line !== "") {
                    program.push(line);
                }
            }

            // first put the nodes in a tree for each line
            for (let a = 0; a < program.length; a++) {
                if (!program[a].built) {
                    program[a] = parse_brackets_and_id_nodes(program[a]);
                }
            }

            for (let i = 0; i < program.length; i++) { // each line of code

                if (!program[i].built) {
                    // build out possibile ASTs

                    // set up initial conditions for building out the ASTs
                    if (!Object.hasOwn(program[i], "asts")) {
                        program[i].asts = [];
                    }
                    let token = JSON.parse(JSON.stringify(program[i].tokens));

                    for(let tokenidx = 0; tokenidx < 1 || tokenidx < token.children.length - 1; tokenidx++) {
                        if (token.children[tokenidx].symbol == '[') {
                            continue;
                        }
                        newparent = JSON.parse(JSON.stringify(token.children[tokenidx]));
                        // program[i].asts.push(newparent);
                        build_trees(program[i], // line of code
                            newparent, // copy of the new parent
                            tokenidx, // location of that parent among siblings
                            JSON.parse(JSON.stringify(token.children))); // copy of it and its siblings
                    }

                    let ast_count = program[i].asts.length;
                    for (let chk = 0; chk < i; chk++) {
                        ast_count *= program[chk].asts.length;
                        if (ast_count > Valence.parser.MAX_TOTAL_ASTS) {
                            throw {name : "SyntaxError", message : "SyntaxError: This program generates too many interpretations"};
                        }
                    }

                    // fill out the reading field of each ast
                    // asts will multiply when an end node can be read in multiple ways
                    for (let j = 0; j < program[i].asts.length; j++) {
                        try {
                            interpret_node(program[i], program[i].asts[j], program[i].asts[j], true, j);
                        } catch (e) {
                            if (Object.hasOwn(e, "name"))  {
                                if (DEBUG) {
                                    console.error(`${e.name}: ${e.message}`);
                                }
                                // clear its top node's reading so it will be wiped
                                program[i].asts[j].reading = [];
                            } else
                                console.error(e);
                        }

                        if (program[i].asts[j].reading !== undefined && program[i].asts[j].reading.length !== 0) {
                            try {
                                retset = this.print_ast(program[i].asts[j], true);
                            } catch (e) {
                                if (Object.hasOwn(e, "name")) 
                                    console.error(`${e.name}: ${e.message}`);
                                else
                                    console.error(e);
                            }
                            program[i].asts[j].line = retset[0];
                            program[i].asts[j].line_markers = retset[1];
                        }

                        // debug: print the tree
                        // console.log(this.print_ast_detail(program[i].asts[j]));
                    }

                    // filter out those without valid readings
                    program[i].asts = program[i].asts.filter(x => x.reading !== undefined && x.reading.length !== 0);

                    if (DEBUG) {
                        complete_time = Date.now();
                        seconds = Math.floor(complete_time/1000) - Math.floor(start_time/1000);
                        if (seconds > 0 ) {
                            outstr = `\parsed in ${seconds} seconds`;
                        } else {
                            outstr = `\parsed in ${complete_time - start_time} milliseconds`;
                        }
                    }

                    if (DEBUG) {
                        console.log(outstr);
                    }
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

Valence.parser.MAX_TOTAL_ASTS = 1000;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.parser;
}
