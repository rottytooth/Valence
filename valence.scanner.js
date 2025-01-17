if (!Valence) var Valence = {};

if (typeof module !== 'undefined' && module.exports) { 
    Valence.lexicon = require('./valence.lexicon');
}

class scanner {

    static convert(line) {
        // convert Roman chars to valid Valence signs
        line = [...line];

        for(let c = 0; c < line.length; c++) {
            for(const [key, value] of Object.entries(Valence.lexicon)) {
                if (Array.isArray(value) && value.filter(x => x.name === line[c].toUpperCase() && x.type === "var").length === 1) {
                    line[c] = key;
                    break;
                }
            }
        }
        return line.join('');
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

            // everything else is a single character
            let curr_char = line[i]
            let k = Valence.lexicon[curr_char];

            if (k !== undefined) {
                const augmented_list = k.map( x => {x.symbol = curr_char; return x;});
                instructions.push({
                    symbol: augmented_list[0].symbol,
                    type: "symbol",
                    potential_readings: augmented_list.map(({ symbol, ...item }) => item)
                });
            } else {
                // we should never get here
                throw {name: "InternalError", message: `Unknown character: ${curr_char}`};
            }
        }
        return instructions;
    };

    static do_brackets_match(line) {
        let open = line.split("[").length - 1;
        let close = line.split("]").length - 1;
        return open === close;
    }

    static remove_non_valence_chars(line) {
        line = Array.from(line);
        let new_line = "";
        for (let i = 0; i < line.length; i++) {
            if (Object.keys(Valence.lexicon).includes(line[i]) || line[i] === '[' || line[i] === ']') {
                new_line += line[i];
            }
        }
        return new_line;
    }

    static evaluate_line(line, read_roman_chars = true, ln = -1) {
        line = line.trim();

        if (!scanner.do_brackets_match(line)) {
            if (ln > -1)
            throw {name: "SyntaxError", message: `Brackets do not match on lineln+1}`};
            else
                throw {name: "SyntaxError", message: `Brackets do not match`};
        }
        if (read_roman_chars) {
            line = scanner.convert(line);
        }
        line = scanner.remove_non_valence_chars(line);
        return {
            line: line,
            tokens: scanner.scan(line),
            built: false
        }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        scanner: scanner
    }
}