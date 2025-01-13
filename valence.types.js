if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    var fs = require('node:fs');
    const {performance} = require('perf_hooks');
}

// each VALUE type relies on the goodwill of the interpreter to correctly assign its initial value argument. After that, assignment relies on the specific conversion rules for each type from each other type

// toString() is how it is printed to the screen
// toDisplay() is how it is represented in the status bar (indicating its type)

const build_val_obj = (type, value) => {
    switch(type) {
        case "int":
            return new Int(Int.cast(value));
        case "char":
            return new Char(Char.cast(value));
        case "bool":
            return new Bool(Bool.cast(value));
        case "string":
            return new v_String(v_String.cast(value));
        case "ratio":
            return new Ratio(Ratio.cast(value));
        case "queue":
            return new Queue(Queue.cast(value));
    }
}

class Int {
    constructor(initial_value) {
        if (typeof(initial_value) == "string") {
            initial_value = parseInt(initial_value);
        }
        this.type = "int";
        if (Object.hasOwn(initial_value, 'type')) {
            this.value = Int.cast(initial_value);
        } else {
            // assumes a direct assignment will be in interpreter, and of correct type
            this.value = initial_value;
        }
    }

    static cast(value) {
        switch (value.type) {
            case "int":
                return value.value;
            case "char":
                return value.value.charCodeAt(0);
            case "bool":
                return value.value > 0 ? 1 : 0;
            case "string":
                return parseInt(value.value);
            case "ratio":
                return Math.floor(value.num / value.den);
            case "queue":
                return Int.cast(value.dequeue());
        }
    }

    toString() {
        return this.value;
    }
    toDisplay() {
        return this.value;
    }

    add(value) {
        return new Int(this.value + Int.cast(value));
    };
    sub(value) {
        return new Int(this.value - Int.cast(value));
    };
    mul(value) {
        return new Int(this.value * Int.cast(value));
    };
    div(value) {
        return new Int(this.value / Int.cast(value));
    };
    not(value) {
        return new Int(0 - this.value);
    }
    append(value) {
        return this.add(value);
    }
}

class Char extends Int {
    // internal storage for Char is an Int

    constructor(initial_value) {
        super(initial_value);
        this.type = "char";
    }

    toString() {
        return String.fromCharCode(this.value);
    }
    toDisplay() {
        return "'" + String.fromCharCode(this.value) + "'";
    }

    add(value) {
        return new Char(super.add(value));
    }
    sub(value) {
        return new Char(super.sub(value));
    };
    mul(value) {
        return new Char(super.mul(value));
    };
    div(value) {
        return new Char(super.div(value));
    };
    not(value) {
        return new Char(super.not(value));
    }
    append(value) {
        if (value.type == "char" || value.type == "int") {
            return new v_String(
                String.fromCharCode(this.value) + 
                String.fromCharCode(value.value));
        }
        if (value.type == "string") {
            return new v_String(
                String.fromCharCode(this.value) + value.value);
        }
    }
}

class v_String {
    constructor(initial_value) {
        this.value = initial_value.toString();
        this.type = "string";
    }

    static cast(value) {
        switch (value.type) {
            case "int":
            case "char":
                return String.fromCharCode(value.value);
            case "bool":
            case "ratio":
                return value.toString();
            case "string":
                return value.value;
            case "queue":
                return value.dequeue().toString();
        }
    }

    toString() {
        return this.value;
    }
    toDisplay() {
        return '"' + this.value + '"';
    }

    add(value) {
        return new v_String(this.value + v_String.cast(value));
    };

    // no change for sub, mul, div, not
    sub(value) {
        return new v_String(value);
    };
    mul(value) {
        return new v_String(value);
    };
    div(value) {
        return new v_String(value);
    };
    not(value) {
        return new v_String(value);
    }
    append(value) {
        return this.add(value);
    }
}

class Bool {
    constructor(initial_value) {
        this.value = initial_value;
        this.type = "bool";
    }

    static cast(value) {
        switch (value.type) {
            case "int":
                return value.value > 0;
            case "char":
                return value.value.charCodeAt(0) > 0;
            case "bool":
                return value.value;
            case "string":
                return value.value.toLower().trim() == "true";
            case "ratio":
                return value.num / value.den > 0;
            case "queue":
                return Int.cast(value.dequeue()).value > 0;
        }
    }

    toString() {
        return this.value;
    }
    toDisplay() {
        return '"' + this.value + '"';
    }

    add(value) {
        return new v_String(this.value + v_String.cast(value));
    };

    // no change for sub, mul, div, not
    sub(value) {
        return new v_String(value);
    };
    mul(value) {
        return new v_String(value);
    };
    div(value) {
        return new v_String(value);
    };
    not(value) {
        return new v_String(value);
    }
    append(value) {
        return this.add(value);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Int: Int,
        Char: Char,
        String: v_String,
        Bool: Bool,
        build_val_obj: build_val_obj
    }
} else {
    // for browser
    var v = {};
    v.Int = Int,
    v.Char = Char,
    v.String = v_String,
    v.Bool = Bool,
    v.build_val_obj = build_val_obj    
}