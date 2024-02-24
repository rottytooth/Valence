
if (!Valence) var Valence = {};

const alphabet = "𐅶 𐆇 𐅾 𐆋 𐆉 𐅻 𐆌 𐆊 𐆁 𐆃 𐅄";

Valence.lexicon = {
    '𐅶': [
        {
            name: "%2",
            type: "exp",
            children: [{type: "var"},{type:"exp"}],
            js: "({var}%2=={exp})"
        },
        {
            name: "*2",
            type: "exp",
            children: [{type: "exp"}],
            js: "({exp}*2)"
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
            js: "factor({exp})"
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
            children: [{type: "var"},{type: "exp"},{type: "exp"},{type: "exp"}],
            js: "for ({var} = {exp}; {var} < {exp2}; {var}+={exp3}) {"
        },
        {
            name: "randomize",
            type: "cmd",
            children: [{type: "var"},{type: "exp"}],
            js: "{var} = {var} * Math.floor(Math.random() * {exp})"
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
            children: [{type: "exp"},{type: "exp"},{type: "exp"}],
            js: "{exp} ? {exp2} : {exp3}"
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
    ],
    '𐅄': [
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
            js: "String({exp})"
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
    '𐆉': [
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
//"𐅶 𐆇 𐅾 𐆋 𐆉 𐅻 𐆌 𐆊 𐆁 𐆃 𐅄"
Valence.lexicon.descriptions = {
    '𐆊': {
        key: 'q',
        theme: "the void",
        meanings: "0, empty the bucket"
    },
    '𐆉': {
        key: 'w',
        theme: "unity",
        meanings: "no-op, 1"
    },
    '𐅶': {
        key: 'e',
        theme: "dual",
        meanings: "binary, twoness, a doubling, the opposite, branching",
        interpretations: ["2","*2","2","0-{exp}","else"]
    },
    '𐅾': {
        key: 'r',
        theme: "three",
        meanings: "3, threeness, ternary conditional, a ternary value, else"
    },
    '𐅻': {
        key: 'a',
        theme: "unneveness, more than easily recognized, a movement toward entropy",
        meanings: "5, multiplying, a complication, floating point number"
    },
    '𐆌': {
        key: 's',
        theme: "a const value, assignment, a string, else",
        meanings: "const, assign, string"
    },
    '𐆇' :{
        key: 'd',
        theme: "factors",
        meanings: "factors"
    },
    '𐅄': {
        key: 'f',
        theme: "reveal",
        meanings: "print to the screen, invoke immediate calculation, print to file"
    },
    '𐆃': {
        key: 'z',
        theme: "decline, decay, close",
        meanings: "counting down, subtracting"
    },
    '𐆁': {
        key: 'c',
        theme: "",
        meanings: "while, a range"
    }
};


if (typeof module !== 'undefined' && module.exports) {
    module.exports = Valence.lexicon;
}