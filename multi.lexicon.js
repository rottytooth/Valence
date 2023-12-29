
if (!ᝎ) var ᝎ = {};

ᝎ.lexicon = {
    'ᝈ': [
        {
            name: "%2==0",
            type: "exp",
            children: [{type: "exp"}],
            js: "({exp}%2==0)"
        },
        {
            name: "2",
            type: "exp",
            children: [],
            js: "2"
        },
        {
            name: "*2",
            type: "exp",
            children: [{type: "exp"}],
            js: "({exp}*2"
        },
        {
            name: "if",
            type: "cmd",
            children: [{type: "exp"}],
            js: "if ({exp}) {"
        },
        {
            name: "else",
            type: "cmd",
            children: [],
            js: "} else {"
        }
    ],
    'ᝂ': [ 
        {
            name: "factor",
            type: "exp",
            children: [{type: "exp"}],
            js: "dunno"
        },
        {
            name: "/",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}],
            js: "{exp} / {exp2}"
        },
        {
            name: "for",
            alternate: "stepwise",
            type: "cmd",
            children: [{type: "var"},{type: "exp"},{type: "exp"}],
            js: "for ({var} = {exp}; while {var} < {exp2}; {var}++) {"
        },
        {
            name: "offset",
            type: "cmd",
            children: [{type: "var"}],
            js: "dunno"            
        },
        {
            name: "rand",
            type: "exp",
            children: [],
            js: "dunno"
        }
    ],
    'ᝀ': [
        {
            name: "3",
            type: "exp",
            children: [],
            js: "3"
        },
        {
            name: "else if",
            type: "cmd",
            children: [{type: "exp"}],
            js: "} else if ({exp}) {"
        },
        {
            name: "ternary",
            type: "exp",
            children: [],
            js: "dunno"
        }
    ],
    'ᝎ': [
        {
            name: "4",
            type: "exp",
            children: [],
            js: "4"
        },
        {
            name: "/4",
            type: "exp",
            children: [{type: "exp"}],
            js: "/4"
        },
        {
            name: "*",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}],
            js: "(({exp})*({exp2}))"
        },
        {
            name: "parseFloat",
            type: "exp",
            children: [{type: "exp"}],
            js: "parseFloat({exp})"
        }
    ],
    'ᝄ': [
        {
            name: "print",
            type: "cmd",
            children: [{type: "exp"}],
            js: "print({exp});"
        }
    ],
    'ᝐ': [
        {
            name: "5",
            type: "exp",
            children: [],
            js: "5"
        },
        {
            name: "decrement",
            type: "cmd",
            children: [{type: "var"}],
            js: "{var}--;"
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
            children: [{type: "exp"}],
            js: "parseInt({exp})"
        },
        {
            name: "-",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}],
            js: "({exp}-{exp2})"
        },
    ],
    'ᝏ': [
        //"const", 
        {
            name: "assign",
            type: "cmd",
            children: [{type: "var"},{type: "exp"}],
            js: "{var} = {exp};"
        },
        {
            name: "toStr",
            type: "exp",
            children: [{type: "exp"}],
            js: "String(exp)"
        },
        {
            name: "else",
            type: "cmd",
            children: [],
            js: "} else {"
        },
    ],
    'ᝌ': [
        {
            name: "0",
            type: "exp",
            children: [],
            js: "0"
        },
        {
            name: "end block",
            type: "cmd",
            children: [],
            js: "}"
        }
    ],
    'ᝃ': [
        {
            name: "label",
            type: "cmd",
            children: [{type: "var"}],
            js: "{var}:"
        }
    ],
    'ᝑ': [
        {
            name: "+",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}],
            js: "({exp}+{exp})"
        },
        {
            name: "^",
            type: "exp",
            children: [{type: "exp"},{type: "exp"}],
            js: "({exp}^{exp2})"
        }
    ],
    'ᝊ': [
        {
            name: "while",
            type: "cmd",
            children: [{type: "exp"}],
            js: "while({exp}) {"
        },
        {
            name: "goto",
            type: "cmd",
            children: [{type: "var"}],
            js: "goto {var}"
        },
        {
            name: "1",
            type: "exp",
            children: [],
            js: "1"
        }
    ]
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ᝎ.lexicon;
}