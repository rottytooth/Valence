if (!Valence) var Valence = {};

Valence.lexicon = {
    '𐅶': [
        {
            name: "0",
            type: "digit",
            params: [],
            js: "0"
        },
        {
            name: "Q",
            type: "var",
            params: [],
            js: "Q",
            pseudo: "𐅶"
        },
        {
            name: "int",
            type: "type",
            params: [],
            js: "int"
        },
        {
            name: "not",
            type: "exp",
            params: [{type: "exp"}],
            js: "!({exp})"
        },
        {
            name: "add",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} + {exp2})"
        },
        {
            name: "while",
            type: "cmd",
            params: [{type: "exp"}],
            js: "while({exp}) {"
        },
        {
            name: "add_assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "{var} = ({var} + {exp})"
        }
    ],
    '𐆇': [ 
        {
            name: "1",
            type: "digit",
            params: [],
            js: "1"
        },
        {
            name: "W",
            type: "var",
            params: [],
            js: "W",
            pseudo: "𐆇"
        },
        {
            name: "read_as_int",
            type: "exp",
            params: [{type: "digit"}],
            js: "{digit}"
        },
        {
            name: "sub",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} - {exp2})"
        },
        {
            name: "if",
            type: "cmd",
            params: [{type: "exp"}],
            js: "if ({exp}) {"
        },
        {
            name: "sub_assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "{var} = ({var} - {exp})"
        }
    ],
    '𐅾': [
        {
            name: "2",
            type: "digit",
            params: [],
            js: "2"
        },
        {
            name: "E",
            type: "var",
            params: [],
            js: "E",
            pseudo: "𐅾"
        },
        {
            name: "ratio",
            type: "type",
            params: [],
            js: "ratio"
        },
        {
            /* forces the var reading */
            name: "read_as_var",
            type: "exp",
            params: [{type: "var"}],
            js: "{var}"
        },
        {
            name: "div",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} / {exp2})"
        },
        {
            name: "end_block",
            type: "cmd",
            params: [],
            js: "}"
        },
        {
            name: "goto",
            type: "cmd",
            params: [{type: "exp"}],
            js: "goto({exp})"
        },
    ],
    '𐆋': [
        {
            name: "3",
            type: "digit",
            params: [],
            js: "3"
        },
        {
            name: "A",
            type: "var",
            params: [],
            js: "A",
            pseudo: "𐆋"
        },
        {
            name: "to_str",
            type: "exp",
            params: [{type: "exp"}],
            js: "str({exp})"
        },
        {
            name: "equals",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} == {exp2})"
        },
        {
            name: "print",
            type: "cmd",
            params: [{type: "exp"}],
            js: "print({exp});"
        },
        {
            name: "for",
            type: "cmd",
            params: [{type: "var"},{type: "var", name: "range"}],
            js: "for ({var} = {range}[0]; {var} < {range}[1]; {var}+={range}[1] >= {range}[0]) {"
        }
    ],
    '𐆉': [
        {
            name: "4",
            type: "digit",
            params: [],
            js: "4"
        },
        {
            name: "S",
            type: "var",
            params: [],
            js: "S",
            pseudo: "𐆉"
        },
        {
            name: "string",
            type: "type",
            params: [],
            js: "str"
        },
        {
            name: "int_or_floor",
            type: "exp",
            params: [{type: "exp"}],
            js: "int({exp})"
        },
        {
            name: "value",
            type: "exp",
            params: [{type: "type"},{type: "exp"}],
            js: "value({type},{exp})"
        },
        {
            name: "label",
            type: "cmd",
            params: [{type: "var"}],
            js: "set_label(label, {var});",
            pseudo: "set_label({var})"
        },
        {
            name: "assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "let {var} = {exp};"
        }
    ],
    '𐅻': [
        {
            name: "5",
            type: "digit",
            params: [],
            js: "5"
        },
        {
            name: "D",
            type: "var",
            params: [],
            js: "D",
            pseudo: "𐅻"
        },
        {
            name: "char",
            type: "type",
            params: [],
            js: "char"
        },
        {
            name: "mult_by_eight",
            type: "exp",
            params: [{type: "exp"}],
            js: "({exp}*8)"
        },
        {
            name: "random",
            type: "exp",
            params: [{type: "type"},{type: "exp"}],
            js: "rand({type},{exp})"
        },
        {
            name: "jump",
            type: "cmd",
            params: [{type: "exp"}],
            js: "jmp({exp})"
        },
        {
            // must also turn variable into a list if it isn't yet
            name: "append",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "{var} += {exp};"
        }
    ],
    '𐆊': [
        {
            name: "6",
            type: "digit",
            params: [],
            js: "6"
        },
        {
            name: "Z",
            type: "var",
            params: [],
            js: "Z",
            pseudo: "𐆊"
        },
        {
            name: "or",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} || {exp2})"
        },
        {
            name: "else",
            type: "cmd",
            params: [],
            js: "} else {"
        },
        {
            name: "else_if",
            type: "cmd",
            params: [{type: "exp"}],
            js: "} else if ({exp}) {"
        },
        {
            name: "assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "let {var} = ({exp});"
        }
    ],
    '𐆁': [
        {
            name: "7",
            type: "digit",
            params: [],
            js: "7"
        },
        {
            name: "X",
            type: "var",
            params: [],
            js: "X",
            pseudo: "𐆁"
        },
        {
            name: "mul",
            type: "exp",
            params: [{type: "exp"},{type: "exp", name:"exp2"}],
            js: "({exp} * {exp2})"
        },
        {
            name: "input",
            type: "cmd",
            params: [{type: "var"}],
            js: "{var} = input();"
        },
        {
            name: "mul_assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "{var} = mul({exp});"
        }
    ]
};

Valence.lexicon.to_string = function(md=false) {
    retstr = "";
    for (let key in Valence.lexicon) {
        retstr += key;
        retstr += "\n";
        for (let i = 0; i < Valence.lexicon[key].length; i++) {
            // generate markdown chart
            if (md) {
                let name = Valence.lexicon[key][i].name;
                if (Valence.lexicon[key][i].type === "var") {
                    name = key;
                }
                retstr += `  |  | ${name} | ${Valence.lexicon[key][i].type} | ${Valence.lexicon[key][i].params.length}\n`;
            } else {
                retstr += `    ${Valence.lexicon[key][i].name} (${Valence.lexicon[key][i].type}) ${Valence.lexicon[key][i].params.length}\n`;
            }
        }
        retstr += "\n";
    }
    return retstr;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.lexicon;
}