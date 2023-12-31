
if (!ᝎ) var ᝎ = {};

const alphabet = "ᝈ ᝂ ᝀ ᝎ ᝄ ᝐ ᝏ ᝌ ᝃ ᝑ ᝊ";

const alphabet2 = "q w e r a s d f z x c";

const alphabet3 = "ᝏ ꕃ ᝃ ᝄ ᝊ ꘫ ᝌ ᝎ ꖴ ᝀ ᝐ"


ᝎ.lexicon.descriptions = {
    'ᝏ': {
        key: 'q',
        theme: "the void",
        meanings: "0, empty the bucket"
    },
    'ꕃ': {
        key: 'w',
        theme: "unity",
        meanings: "no-op, 1"
    },
    'ᝃ': {
        key: 'e',
        theme: "dual",
        meanings: "binary, twoness, a doubling, the opposite, branching",
        interpretations: ["2","*2","2","0-{exp}","else"]
    },
    'ᝄ': {
        key: 'r',
        theme: "three",
        meanings: "3, threeness, ternary conditional, a ternary value, else"
    },
    'ᝊ': {
        key: 'a',
        theme: "unneveness, more than easily recognized, a movement toward entropy",
        meanings: "5, multiplying, a complication, floating point number"
    },
    'ꘫ': {
        key: 's',
        theme: "harmony, recovening, solidity",
        meanings: "7, a string"
    },
    'ᝌ' :{
        key: 'd',
        theme: "many",
        meanings: "11, {exp} ^ {exp}"
    },
    'ᝎ': {
        key: 'f',
        theme: "reveal",
        meanings: "print to the screen, invoke immediate calculation, print to file"
    },
    'ꖴ': {
        key: 'z',
        theme: "decline, decay, close",
        meanings: "counting down, subtracting"
    },
    'ᝀ': {
        key: 'x',
        theme: "divide",
        meanings: "factors, dividing, stepwise down",
        interpretations: ["prime_factors({exp})","/"]
    },
    'ᝐ': {
        key: 'c',
        theme: "",
        meanings: "while, a range"
    }
}

ᝎ.lexicon = {
    'ᝈ': [
        {
            name: "%2==0",
            type: "exp",
            children: [{type: "exp"}],
            js: "({exp}%2==0)"
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
            js: "for ({var} = {exp}; {var} < {exp2}; {var}++) {"
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
            name: "/4",
            type: "exp",
            children: [{type: "exp"}],
            js: "{exp}/4"
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
            name: "decrement",
            type: "cmd",
            children: [{type: "var"}],
            js: "{var}-=1;"
        },
        {
            name: "decrement",
            type: "exp",
            children:[{type: "exp"}], // must be of type int
            js: "{exp}--"
        },
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