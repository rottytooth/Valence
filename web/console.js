var program = "";
var curr_line = "";
var hit_return = false;

document.addEventListener('DOMContentLoaded', function() {
    // document.onkeypress = keyevents;
    document.onkeydown = specialKeys;
    let editor = document.getElementById("program-text");
    editor.focus();
    editor.addEventListener("input", updateInput);
}, false);

const updateInput = () => {
    // let caret = getCaretPosition(document.getElementById("program-text"));
    let txt = document.getElementById("program-text");
    let prog = Array.from(txt.value);
    let outprog = "";
    for (let p = 0; p < prog.length; p++) {
        if (prog[p] === "\n" || prog[p] === "[" || prog[p] === "]") {
            outprog += prog[p];
            continue;
        }
        for(const [key, value] of Object.entries(Valence.lexicon)) {
            if (prog[p] === key) {
                outprog = outprog + key;
                break;
            }
            if (Array.isArray(value) && value.filter(x => x.name === prog[p].toUpperCase() && x.type === "var").length === 1) {
                outprog = outprog + key;
                break;
            }
        }
    }
    txt.value = outprog;
    // setCaretPosition(txt, caret)
    processLine();
}

// not used
const specialKeys = (e) => {
    if (e.keyCode == 13) { // return key
        hit_return = true;
    }
}

const processLine = () => {
    let txt = document.getElementById("program-text");
    let prog = Valence.interpreter.parse_to_proglist(txt.value);
    let run_holder = document.getElementById("programs-running");

    run_holder.innerText = ""; // clear it

    for (let r = 0; r < prog.length; r++) {
        let run = document.createElement("div");
        run.classList += "code-block";
        
        let code_text = document.createElement("div");
        code_text.classList += "valence-code";
        for (let i = 0; i < prog[r].length; i++) {
            if (i > 0) {
                linebreak = document.createElement("br");
                code_text.appendChild(linebreak);
            }
            line_node = document.createTextNode(prog[r][i].line);
            code_text.appendChild(line_node);
        }
        run.appendChild(code_text);

        let intrpt = document.createElement("div");
        intrpt.classList += "js-code";
        for (let i = 0; i < prog[r].length; i++) {
            if (i > 0) {
                intrpt.innerHTML += "<br/>";
            }
            reading_node = document.createTextNode(prog[r][i].reading.js);
            intrpt.appendChild(reading_node);
        }
        run.appendChild(intrpt);

        run_holder.appendChild(run);
    }
}