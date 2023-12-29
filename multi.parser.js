if (!ᝎ) var ᝎ = {};

if (typeof module !== 'undefined' && module.exports) { 
    ᝎ.lexicon = require('./multi.lexicon');
}

class scanner {
    static scan(line) {
        let instructions = [];
        for (let i = 0; i < line.length; i++) {
            // string handling
            if (line.charAt(i) == '"' || line.charAt(i) == '\'') {
                let quote_symbol = line.charAt(i);
                let stringval = "";
                i++;
                while (line.charAt(i) != quote_symbol) {
                    stringval += line.charAt(i);
                    i++;
                    //FIXME: deal with strings that don't close
                    //FIXME: also deal with escaped quotes
                }
                instructions.push({
                    symbol: '"' + stringval + '"',
                    type: "string",
                    val: stringval});
                i++;
                if (i >= line.length) break;
            }
            // everything else is a single character
            let k = ᝎ.lexicon[line.charAt(i)];
            if (k !== undefined) {
                let augmented_list = k.map( x => {x.symbol = line.charAt(i); return x;});
                instructions.push(augmented_list);
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

    var built_programs = [];

    const next_unpopulated_expression = (node, type="var") => {
        // defaults to "var" as that is the widest set of options

        if (!("children" in node)) {
            // no children to process
            return null;
        }

        for (let i = 0; i < node.children.length; i++) {
            if (!("name" in node.children[i]) && 
                (node.children[i].type == "exp" || 
                (node.children[i].type == "var" && type == "var"))) {
                // A var or an exp can both be exps, but only a var is a var

                // child is unassigned
                return node.children[i];
            } else {
                let exp_match = next_unpopulated_expression(node.children[i]);
                if (exp_match !== undefined && exp_match !== null) {
                    return exp_match;
                }
            }
        }
    }

    const populate_tree_with_expressions = (cmdtree, built_lines) => {
        // check if completely populated
        if (!next_unpopulated_expression(cmdtree.command)) {
            // check if all tokens are used -- if so, keep as completed
            if (cmdtree.tokens.length == 0)
                built_lines.push(cmdtree);
            return;
        }
        // run through each possible expression to use
        for (let i = 0; i < cmdtree.tokens.length; i++) {

            // if (cmdtree.command.children.length == 0) continue;

            for(let j = 0; j < cmdtree.tokens[i].length; j++) {
                if (cmdtree.tokens[i][j].type == "cmd") {
                    continue;
                }
                // cmdtree.tokens[i][j].type == "var" && 
                // if (cmdtree.command.name == "goto") {
                //     console.log("stop here");
                // }
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

    const create_tree_for_each_cmd = (linenode) => {

        let cmd_trees = [];

        // first, construct one with each possible command
        for (let i = 0; i < linenode.tokens.length; i++) {
            // let cmds = linenode.tokens[i].find(t => t.type == "cmd");
            let new_tree = JSON.parse(JSON.stringify(linenode));

            // find index of all commands
            while (new_tree.tokens[i].findIndex(t => t.type == "cmd") !== -1) {
                let cmd_loc = new_tree.tokens[i].findIndex(t => t.type == "cmd");

                new_tree.tokens[i].isCmd = true;
                new_tree.command = new_tree.tokens[i][cmd_loc];
                new_tree.tokens[i].splice(cmd_loc, 1);

                // make a copy to save to the cmd_tree list (this is is necessary in case the symbol has more than one command)
                let cmd_tree = JSON.parse(JSON.stringify(new_tree));

                // in the copy, we clear all other possible interpretations of the command symbol
                cmd_tree.tokens.splice(i, 1);

                // DEBUG
                // console.log(JSON.stringify(cmd_tree, 1));

                cmd_trees.push(cmd_tree);
            }
        }

        return cmd_trees;
    };

    const add_variables = (linenode) => {
        for(let i = 0; i < linenode.line.length; i++) {
            linenode.tokens[i].push({
                name: linenode.line[i],
                type: "var",
                children: []
            });
        }
    }

    const build_trees = (linenode) => {
        add_variables(linenode);

        let built_lines = [];

        let cmd_trees = create_tree_for_each_cmd(linenode);

        if (cmd_trees.length == 0) {
            throw new Error("Sorry, there are no valid interpretations of this line of code");
        }

        for(let i = 0; i < cmd_trees.length; i++) {
            populate_tree_with_expressions(cmd_trees[i], built_lines);
        }
        linenode.built = true;

        return built_lines;
    }

    const transpile_js = (line_tree) => {

        let retstr = line_tree.js;

        let varloc = line_tree.children.findIndex(x => x.type == "var");
        if (varloc > -1) {
            if (retstr.indexOf("{var}") > -1)
                retstr = retstr.replace('{var}', line_tree.children.find(x => x.type == "var").name);
            else if (retstr.indexOf("{exp}") > -1)
                retstr = retstr.replace('{exp}', line_tree.children.find(x => x.type == "var").name);
            else if (retstr.indexOf("{exp2}") > -1)
                retstr = retstr.replace('{exp2}', line_tree.children.find(x => x.type == "var").name);
        }

        let exploc = line_tree.children.findIndex(x => x.type == "exp");
        if (exploc > -1) {
            retstr = retstr.replace('{exp}', transpile_js(line_tree.children[exploc]));
        }

        let exp2loc = line_tree.children.indexOf(x => x.type == "exp", exploc);
        if (exp2loc > -1) {
            retstr = retstr.replace('{exp2}', transpile_js(line_tree.children[exp2loc]));
        }

        return retstr;
    }

    return (function () {
        // public functions

        this.parse = (input, complete) => {
            if (complete) {
                let lines = input.split(/\r?\n/);
                program = lines.map(s => scanner.evaluate_line(s));
            } else {
                program.push(scanner.evaluate_line(input));
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
                    for(let j = 0; j < line_trees.length; j++)
                        console.log(transpile_js(line_trees[j].command));
                }
            }
        }

        this.program_state = () => {
           return JSON.stringify(program);
        }
    });
})();

ᝎ.parser = new parser();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ᝎ.parser;
}


// entry point for testing for the moment

// ᝎ.parser.parse("ᝊᝌᝐ",false);

ᝎ.parser.parse("ᝊᝌ",false);

//ᝎ.parser.parse("ᝈᝊᝀᝂᝀᝄ",false);
