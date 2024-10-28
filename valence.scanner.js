if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    Valence.lexicon = require('./valence.lexicon');
}

class scanner {

    static get_noncommand(i, line, instructions) {
        // Capture text outside the alphabet in case it's used as a constant
        // Returns -1 if unhandled, otherwise returns new index
        let capture = "";
        for ( ; i < line.length && !(line[i] in Valence.lexicon); i++) {
            capture += line[i];
        }
        capture = capture.trim();

        if (!capture) {
            // nothing captured, nothing handled
            return -1;
        }

        let num = NaN;
        if (capture.indexOf(".") >= 0) {
            // attempt float
            num = parseFloat(capture);
            if (!isNaN(num)) {
                instructions.push([{
                    symbol: num,
                    type: "float",
                    val: num,
                    js: capture
                }]);        
                return i;
            }
        }
        num = parseInt(capture);
        if (!isNaN(num)) {
            // attempt int
            instructions.push([{
                symbol: num,
                type: "int",
                val: num,
                js: capture
            }]);        
            return i;
        }

        // otherwise, take as a string
        instructions.push([{
            symbol: capture,
            type: "str",
            val: capture,
            js: '"' + capture + '"'
        }]);
        return i;
    }

    static scan(line) {
        let instructions = [];

        line = [...line]; // convert to array for easier manipulation

        for (let i = 0; i < line.length; i++) {

            // if it's whitespace, skip it
            if (line[i] === ' ' || line[i] === '\t') {
                continue;
            }

            // first, is this punctuation (a bracket)?
            if (line[i] === '[') {
                instructions.push({
                    symbol: '[',
                    type: "open_bracket"
                });        
                continue;
            }
            if (line[i] === ']') {
                instructions.push({
                    symbol: ']',
                    type: "close_bracket"
                });        
                continue;
            }

            // handle if code is outside the alphabet
            let new_idx = scanner.get_noncommand(i, line, instructions);
            if (new_idx > -1) {
                i = new_idx;
                continue;
            }

            // everything else is a single character
            let curr_char = line[i]
            let k = Valence.lexicon[curr_char];
            if (k !== undefined) {
                const augmented_list = k.map( x => {x.symbol = curr_char; return x;});
                instructions.push({
                    symbol: augmented_list[0].symbol,
                    type: "symbol",
                    readings: augmented_list.map(({ symbol, ...item }) => item)
                });
            } else {
                // we should never get here
                throw new Error(`Unknown character: ${curr_char}`);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = scanner;
}