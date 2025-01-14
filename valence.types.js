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
                return Math.floor(value.value.num / value.value.den);
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
    not() {
        return new Int(0 - this.value);
    }
    equals(value) {
        return new Bool(this.value == Int.cast(value));
    };
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
    not() {
        return new Char(super.not(this.value));
    }
    equals(value) {
        return new Bool(this.value == Bool.cast(value));
    };
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
        return new v_String(this.value);
    };
    mul(value) {
        return new v_String(this.value);
    };
    div(value) {
        return new v_String(this.value);
    };
    not() {
        return new v_String(this.value);
    }
    equals(value) {
        return new Bool(this.value == v_String.cast(value));
    };
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
                return value.value.num / value.value.den > 0;
            case "queue":
                return Int.cast(value.dequeue()).value > 0;
        }
    }

    toString() {
        return this.value.toString();
    }
    toDisplay() {
        return this.value.toString();
    }

    add(value) {
        return new Bool(this.value + Bool.cast(value));
    };
    // no change for sub, mul, div
    sub(value) {
        return new Bool(value);
    };
    mul(value) {
        return new Bool(value);
    };
    div(value) {
        return new Bool(value);
    };
    not() {
        return new Bool(value);
    }
    equals(value) {
        return new Bool(this.value == Bool.cast(value));
    };
    append(value) {
        return this.add(value);
    }
}

class Ratio {
    constructor(initial_value) {
        this.value = initial_value;
        this.type = "ratio";
    }

    static cast(value) {
        switch (value.type) {
            case "int":
                return {"num": value.value, "den": 1};
            case "char":
                return {"num": value.value.charCodeAt(0), "den": 1};
            case "bool":
                return {"num": value.value ? 1 : 0, "den": 1};
            case "string":
                try {
                    let split = value.split('/');
                    return {"num": parseInt(split[0].trim()), "den": parseInt(split[1].trim())};
                } catch {
                    return {"num": 0, "den": 1};
                }
            case "ratio":
                return {"num": value.num, "den": value.den}
            case "queue":
                return Ratio.cast(value.dequeue()).value;
        }
    }


    toString() {
        return `${this.value.num}/${this.value.den}`;
    }
    toDisplay() {
        return `${this.value.num}/${this.value.den}`;
    }

    reduce(num, den){
        var gcd = function gcd(a,b){
          return b ? gcd(b, a%b) : a;
        };
        gcd = gcd(num, den);
        return new Ratio({"num": num/gcd, "den": den/gcd});
      }

    frac_math(first, second, op) {
        let commonDen = first.den * second.den;
        let newNum1 = first.num * (commonDen / first.den);
        let newNum2 = second.num * (commonDen / second.den);

        let res = 0
        if (op === "sub") {
            res = newNum1 - newNum2
        }
        if (op === "add") {
            res = newNum1 + newNum2
        }
        return this.reduce(res, commonDen);
    }

    add(value) {
        return this.frac_math(this.value, Ratio.cast(value), "add");
    };

    // no change for sub, mul, div, not
    sub(value) {
        return this.frac_math(this.value, Ratio.cast(value), "sub");
    };
    mul(value) {
        value = Ratio.cast(value);
        let num = this.value.num * value.num;
        let den = this.value.den * value.den;
        return this.reduce(num, den);
    };
    div(value) {
        value = Ratio.cast(value);
        let num = this.value.num * value.den;
        let den = this.value.den * value.num;
        return this.reduce(num, den);
    };
    not() {
        return new Ratio({"num": 0 - this.value.num, "den": this.value.den});
    }
    equals(value) {
        let compvals = Ratio.cast(value);
        return new Bool(this.value.num == compvals.num && this.value.den == compvals.den);
    };
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