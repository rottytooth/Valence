
var ᝎ = {};

ᝎ.lexicon = {
    'ᝈ': [
        {
            name: "%2==0",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "2",
            type: "exp",
            children: []
        },
        {
            name: "*2",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "if",
            type: "cmd",
            children: [{type: "exp"}]
        },
        {
            name: "else",
            type: "cmd",
            children: []
        }
    ],
    'ᝂ': [ 
        {
            name: "factor",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "/",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}]
        },
        {
            name: "for",
            alternate: "stepwise",
            type: "cmd",
            children: [{type: "var"},{type: "exp"},{type: "exp"}]
        },
        {
            name: "offset",
            type: "cmd",
            children: [{type: "var"}]
        },
        {
            name: "rand",
            type: "exp",
            children: []
        }
    ],
    'ᝀ': [
        {
            name: "3",
            type: "exp",
            children: []
        },
        {
            name: "else if",
            type: "cmd",
            children: [{type: "exp"}]
        },
        {
            name: "ternary",
            type: "exp",
            children: []
        }
    ],
    'ᝎ': [
        {
            name: "4",
            type: "exp",
            children: []
        },
        {
            name: "/4",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "*",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}]
        },
        {
            name: "parseFloat",
            type: "exp",
            children: [{type: "exp"}]
        }
    ],
    'ᝄ': [
        {
            name: "print",
            type: "cmd",
            children: [{type: "exp"}]
        }
    ],
    'ᝐ': [
        {
            name: "5",
            type: "exp",
            children: []
        },
        {
            name: "decrement",
            type: "cmd",
            children: []
        },
        // as an expression, x-- + ...        
        // {
        //     name: "decrement",
        //     type: "exp",
        //     requires: []
        // },
        {
            name: "parseInt",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "-",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}]
        },
    ],
    'ᝏ': [
        //"const", 
        {
            name: "assign",
            type: "cmd",
            children: [{type: "var"},{type: "exp"}]
        },
        {
            name: "toStr",
            type: "exp",
            children: [{type: "exp"}]
        },
        {
            name: "else",
            type: "cmd",
            children: []
        },
    ],
    'ᝌ': [
        {
            name: "0",
            type: "exp",
            children: []
        },
        {
            name: "end block",
            type: "cmd",
            children: []
        }
    ],
    'ᝃ': [
    ],
    'ᝑ': [
        {
            name: "+",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}]
        },
        {
            name: "^",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}]
        }
    ],
    'ᝊ': [
        {
            name: "while",
            type: "cmd",
            children: [{type: "exp"}]
        },
        // goto
        // char
        // then
        {
            name: "1",
            type: "exp",
            children: []
        }
    ]
};

parser = (function() {
    
    var program = [];

    var built_programs = [];

    const scan = (line) => {
        let instructions = [];
        for (let i = 0; i < line.length; i++) {
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
            let k = ᝎ.lexicon[line.charAt(i)];
            if (k !== undefined) {
                let augmented_list = k.map( x => {x.symbol = line.charAt(i); return x;});
                instructions.push(augmented_list);
            }
        }
        return instructions;
    };

    const evaluate_line = (line) => {
        line = line.trim();
        return {
            line: line,
            tokens: scan(line),
            built: false
        }
    };

    const find_command = (cmd_node_idx, new_tree) => {
        /*
        Mark a single instruction as cmd (by given index), remove alternate readings of that instruction, and remove all other commands 
        */

        // remove all the expressions from the symbol we've picked for cmd
        new_tree.tokens[cmd_node_idx] = new_tree.tokens[cmd_node_idx].filter(obj => obj.type !== 'exp');
        new_tree.command = new_tree.tokens[cmd_node_idx];
        delete new_tree.tokens[cmd_node_idx];
        
        for(let j = 0; j < new_tree.tokens.length; j++) {
            if (j != cmd_node_idx) {
                // remove all cmds from symbols that can only be expressions
                new_tree.tokens[j] = new_tree.tokens[j].filter(obj => obj.type !== 'cmd');
            }
        }

        return new_tree;
    }

    const _is_complete = (tree) => {
        let complete = false;
        for(let i = 0; i < tree.length; i++) {
            if (tree[i].hasOwnProperty("children") && tree.children.length > 0) {
                if (!_is_complete(tree.children)) return false;
            } else {
                complete = tree[i].hasOwnProperty("symbol");
            }
        }
        return complete;
    }

    const build_expression_tree = (linenode, tree) => {
    
        // for each node in the current node's children
        for (let i = 0; i < tree.children.length; i++) {
            
            // try each exp in the open slot
            for (let j = 0; j < linenode.tokens.length; j++) {
                for (let k = 0; linenode.tokens[j].length; k++) {

                    linenode = JSON.parse(JSON.stringify(linenode));
                    delete linenode.tokens[j][k];

                    tree.children[i] = JSON.parse(JSON.stringify(tree));

                    if (isValid(queens, row, i)) {
                        build_expression_tree(linenode, tree.children);
                    }
                }
            }
        }
    }

    const build_trees = (linenode) => {
        // find all commands
        for (let i = 0; i < linenode.tokens.length; i++) {
            let cmds = linenode.tokens[i].find(t => t.type == "cmd");
            if (cmds !== undefined) {
                // assumes only one command per symbol
                let new_tree = JSON.parse(JSON.stringify(linenode));
                new_tree.tokens[i].isCmd = true;
                new_tree = find_command(i, new_tree);
                build_expression_tree(JSON.parse(JSON.stringify(new_tree)), new_tree.command);

                // this is pushing the tree for the LINE 
                //this.built_programs.push({tree: new_tree});
                // console.log(cmds)
                console.log(JSON.stringify(new_tree));
            }
        }
    };

    return (function () {
        // public functions

        this.parse = (input, complete) => {
            if (complete) {
                let lines = input.split(/\r?\n/);
                program = lines.map(s => evaluate_line(s));
            } else {
                program.push(evaluate_line(input));
            }

            for (let i = 0; i < program.length; i++) {
                if (!program[i].built) {
                    // build out possibile ASTs for the line
                    trees = build_trees(program[i]);
                    
                    // add to all the existing programs
                }
            }
        }

        this.program_state = () => {
           return JSON.stringify(program);
        }
    });
})();

ᝎ.parser = new parser();

ᝎ.parser.parse("ᝊᝌᝊᝐᝑᝎᝑᝐ",false);
ᝎ.parser.parse("ᝈᝊᝀᝂᝀᝄ",false);
// console.log(ᝎ.parser.program_state());
