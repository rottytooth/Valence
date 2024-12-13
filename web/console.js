var program = "";
var curr_line = "";

document.addEventListener('DOMContentLoaded', function() {
    document.onkeypress = keyevents;
    document.onkeydown = specialKeys;
}, false);

const keyevents = (e) => {
    var code = e.keyCode || e.which;
    String.fromCharCode(e.keyCode).toUpperCase();
    return true;
}

const specialKeys = (e) => {
    if (e.keyCode == 13) { // return key
        type("<br>");
        processLine();
        e.preventDefault();
        curr_line = "";
    } else {
        for(const [key, value] of Object.entries(Valence.lexicon)) {
            if (Array.isArray(value) && value.filter(x => x.name === String.fromCharCode(e.keyCode).toUpperCase() && x.type === "var").length === 1) {
                type(key);
                break;
            }
        }
    }
}

const type = (char) => {
    let txt = document.getElementById("program-text");
    txt.innerHTML += char;
}

const processLine = () => {
    let txt = document.getElementById("program-text");
    let prog = parse_to_proglist(txt.innerText);
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