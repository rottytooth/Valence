
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
            js: "Q"
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
            js: "(!({exp}))"
        },
        {
            name: "add",
            type: "exp",
            params: [{type: "exp"},{type: "exp", repeat: "1+"}],
            js: "add({exp},{exp2})"
        },
        {
            name: "add_assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp", repeat: "1+"}],
            js: "{var} = add({var},{exp})"
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
            js: "W"
        },
        {
            name: "sub",
            type: "exp",
            params: [{type: "exp"},{type: "exp"}],
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
        },
        {
            name: "randomize",
            type: "cmd",
            params: [{type: "var"},{type: "exp"},{type: "exp"}],
            js: "{var} = {var} * Math.floor(Math.random() * {exp})"
        },
        {
            name: "for",
            alternate: "stepwise",
            type: "cmd",
            params: [{type: "var"},{type: "exp"},{type: "exp"},{type: "exp"}],
            js: "for ({var} = {exp}; {var} < {exp2}; {var}+={exp3}) {"
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
            js: "E"
        },
        {
            name: "div",
            type: "exp",
            params: [{type: "exp"},{type: "exp"}],
            js: "({exp} / {exp2})"
        },
        {
            name: "ratio",
            type: "type",
            params: [],
            js: "ratio"
        },
        {
            name: "end block",
            type: "cmd",
            params: [],
            js: "}"
        },
        {
            name: "goto",
            type: "cmd",
            params: [{type: "exp"}],
            js: "goto(exp)"
        }
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
            js: "A"
        },
        {
            name: "to_str",
            type: "exp",
            params: [{type: "exp"}],
            js: "str({exp)"
        },
        {
            name: "equals",
            type: "exp",
            params: [{type: "exp"},{type: "exp"}],
            js: "(({exp}) == ({exp2}))"
        },
        {
            name: "print",
            type: "cmd",
            params: [{type: "exp"}],
            js: "print({exp});"
        },
        {
            name: "while",
            type: "cmd",
            params: [{type: "exp"}],
            js: "while({exp}) {"
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
            name: "string",
            type: "type",
            params: [],
            js: "str"
        },
        {
            name: "null",
            type: "exp",
            params: [],
            js: "null"
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
            params: [{type: "type"},{type: "digit", repeat: "1+"}],
            js: "value({type},{digit})"
        },
        {
            name: "label",
            type: "cmd",
            params: [{type: "exp"}],
            js: "set_label(label,{exp});"
        },
        {
            name: "assign",
            type: "cmd",
            params: [{type: "var"},{type: "exp"}],
            js: "let {var} = ({exp});"
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
            js: "D"
        },
        {
            name: "char",
            type: "type",
            params: [],
            js: "char"
        },
        {
            name: "mod",
            type: "exp",
            params: [{type: "exp"},{type: "exp"}],
            js: "({exp}%{exp2})"
        },
        {
            name: "jump",
            type: "cmd",
            params: [{type: "exp"}],
            js: "jmp({exp2})"
        },
    ],
    '𐆊': [
        {
            name: "6",
            type: "digit",
            params: [],
            js: "6"
        },
        {
            name: "greater_zero",
            type: "exp",
            params: [{type: "exp"}],
            js: "({exp} > 0)"
        },
        {
            name: "or",
            type: "exp",
            params: [{type: "exp"},{type: "exp"}],
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
            js: "X"
        },
        {
            name: "random",
            type: "exp",
            params: [{type: "exp"}],
            js: "rnd({exp})"
        },
        {
            name: "mul",
            type: "exp",
            params: [{type: "exp"},{type: "exp", repeat: "1+"}],
            js: "mul({exp},{exp2})"
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
            params: [{type: "var"},{type: "exp", repeat: "1+"}],
            js: "{var} = mul({exp2});"
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.lexicon;
}