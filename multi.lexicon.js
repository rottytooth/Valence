
if (!𐅘) var 𐅘 = {};

const alphabet = "𐅶 𐆇 𐅾 𐆋 𐆉 𐅻 𐆌 𐆊 𐆁 𐆃 𐅘";

𐅘.lexicon.descriptions = {
    '𐆌': {
        key: 'q',
        theme: "the void",
        meanings: "0, empty the bucket"
    },
    'ꕃ': {
        key: 'w',
        theme: "unity",
        meanings: "no-op, 1"
    },
    '𐆁': {
        key: 'e',
        theme: "dual",
        meanings: "binary, twoness, a doubling, the opposite, branching",
        interpretations: ["2","*2","2","0-{exp}","else"]
    },
    '𐆉': {
        key: 'r',
        theme: "three",
        meanings: "3, threeness, ternary conditional, a ternary value, else"
    },
    '𐅘': {
        key: 'a',
        theme: "unneveness, more than easily recognized, a movement toward entropy",
        meanings: "5, multiplying, a complication, floating point number"
    },
    'ꘫ': {
        key: 's',
        theme: "harmony, recovening, solidity",
        meanings: "7, a string"
    },
    '𐆊' :{
        key: 'd',
        theme: "many",
        meanings: "11, {exp} ^ {exp}"
    },
    '𐆋': {
        key: 'f',
        theme: "reveal",
        meanings: "print to the screen, invoke immediate calculation, print to file"
    },
    'ꖴ': {
        key: 'z',
        theme: "decline, decay, close",
        meanings: "counting down, subtracting"
    },
    '𐅾': {
        key: 'x',
        theme: "divide",
        meanings: "factors, dividing, stepwise down",
        interpretations: ["prime_factors({exp})","/"]
    },
    '𐅻': {
        key: 'c',
        theme: "",
        meanings: "while, a range"
    }
}

𐅘.lexicon = {
    '𐅶': [
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
    '𐆇': [ 
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
    '𐅾': [
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
    '𐆋': [
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
    '𐆉': [
        {
            name: "print",
            type: "cmd",
            children: [{type: "exp"}],
            js: "print({exp});"
        }
    ],
    '𐅻': [
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
    '𐆌': [
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
    '𐆊': [
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
    '𐆁': [
        {
            name: "label",
            type: "cmd",
            children: [{type: "var"}],
            js: "{var}:"
        }
    ],
    '𐆃': [
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
    '𐅘': [
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
    module.exports = 𐅘.lexicon;
}