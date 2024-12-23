var program = "";
var curr_line = "";
var hit_return = false;

let is_running = false;

TOKEN_TYPES = {
    "c": "cmd",
    "e": "exp",
    "v": "var",
    "d": "digit",
    "t": "type"
}

document.addEventListener('DOMContentLoaded', function() {
    buildControlList();

    let editor = document.getElementById("program-text");
    editor.focus();
    editor.addEventListener("input", updateInput);

    // open first menu item on left
    document.querySelectorAll(".menu-item")[4].classList.add("open");
}, false);

const updateInput = () => {
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
    formatProgram();
    run_stop(false, true);
}

const sytaxHighlight = (ast, line_node) => {
    let i = 0;
    for (let l of ast.line) {
        let sp = document.createElement("span");
        sp.className = `code-${TOKEN_TYPES[ast.line_markers[i]]} code-lex-item`;
        if (l == '[' || l == ']') {
            sp.className += ' code-mono';
        }
        sp.innerText = l;
        line_node.appendChild(sp);
        i++;
    }
}

const formatProgram = () => {
    let txt = document.getElementById("program-text");
    let prog = Valence.interpreter.parse_to_proglist(txt.value);
    let run_holder = document.getElementById("programs-running");

    run_holder.innerText = ""; // clear it

    let runnable = prog.length - prog.filter(x => x.failed === true).length;
    if (!runnable) runnable = 0; // for NaN, undefined, etc.

    intpt_msg = document.getElementById("intpt-msg");
    intpt_msg.innerText = `${prog.length} interpretation${prog.length === 1 ? "" : "s"}, ${runnable} runnable`;

    for (let r = 0; r < prog.length; r++) {
        let bigrun = document.createElement("div");
        bigrun.classList += "outer-code-block";

        let run = document.createElement("div");
        run.id = `prog-${prog[r].id}`;
        run.classList += "code-block";
        if (prog[r].failed === true) {
            run.classList += " failed";
        }
        
        let add_run = true;
        for (let i = 0; i < prog[r].length; i++) {

            let code_row = document.createElement("div");
            code_row.className = "code-row";
            if (prog[r].failed === true && prog[r].length > 1 && prog[r].bad_line === i) {
                code_row.classList += " row-failed";
            }
        
            line_node = document.createElement("div");
            sytaxHighlight(prog[r][i], line_node);
            line_node.className = "valence-code";
            code_row.appendChild(line_node);

            if (prog[r][i].reading.pseudo === undefined) {
                add_run = false;
                break;
            }

            reading_node = document.createElement("div");
            reading_node.innerText = prog[r][i].reading.pseudo;
            reading_node.className = "js-code";
            code_row.appendChild(reading_node);

            run.appendChild(code_row);
        }

        if (add_run) {
            bigrun.appendChild(run);

            let output = document.createElement("div");
            output.className = "output";
            bigrun.appendChild(output);

            run_holder.appendChild(bigrun);
        }
    }
    run_hide_progs();
    add_foot_to_good_programs();
}

const add_foot_to_good_programs = () => {

    // remove all feet
    Array.from(document.getElementsByClassName("running-block")).forEach(x => x.classList.remove("running-block"));

    // selectively add the correct ones
    let unfailedOuterBlocks = Array.from(document.getElementsByClassName("outer-code-block")).filter(x => Array.from(x.children).filter(y => y.classList.contains("failed")).length === 0);

    Array.from(document.getElementsByClassName("code-block")).filter(x => !x.classList.contains("failed")).forEach(x => x.classList.add("running-block"));

    unfailedOuterBlocks.forEach(x => Array.from(x.children).filter(x => x.classList.contains("output"))[0].style.display = "block");
}

function insertTextAtCursor(textareaId, text) {
    const textarea = document.getElementById(textareaId);
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
  
    // Insert the text
    textarea.value = textarea.value.substring(0, startPos) +
      text +
      textarea.value.substring(endPos, textarea.value.length);
  
    // Set cursor position after inserted text
    textarea.selectionStart = startPos + text.length;
    textarea.selectionEnd = startPos + text.length;
    textarea.focus();
  }

const buildButton = (term, typedas) => {
    let controlList = document.getElementById("lang-insert");

    let addBtn = document.createElement("button");
    let btnText = term;
    addBtn.innerText = btnText;
    addBtn.className = "add-btn btn";

    if (typedas !== undefined) {
        let controlKey = document.createElement("div");
        controlKey.className = "control-btn-key";

        let bracket1 = document.createElement("span");
        bracket1.textContent = "[";
        bracket1.className = "control-lt";
        controlKey.appendChild(bracket1);

        controlKey.appendChild(document.createTextNode(typedas));

        let bracket2 = document.createElement("span");
        bracket2.textContent = "]";
        bracket2.className = "control-lt";
        controlKey.appendChild(bracket2);

        addBtn.appendChild(controlKey);
        addBtn.className += " control-btn";
    }
    addBtn.onclick = (e) => {
        insertTextAtCursor("program-text", term);
        updateInput();
    }

    controlList.appendChild(addBtn);
}

const openSubMenu = (e) => {
    if (e.target.classList.contains("open")) {
        e.target.classList.remove("open");
    } else {
        e.target.classList.add("open");
    }
}

const buildLeftControl = (term, typedas, values) => {
    let leftMenu = document.getElementById("left-menu");

    let lexNode = document.createElement("li");
    lexNode.className = "menu-item";
    lexNode.textContent = term;
    lexNode.onclick = openSubMenu;

    let keyNode = document.createElement("span");
    keyNode.className = "control-key";
    keyNode.innerText = typedas;
    lexNode.appendChild(keyNode);

    let lexSubMenu = document.createElement("ul");

    for (val of values) {
        let lexSubMenuItem = document.createElement("li");
        lexSubMenuItem.className = 'sub-menu';

        let lexSubMenuItemKeyOne = document.createElement("span");
        if (val.type == "var" || val.type == "digit") {
            lexSubMenuItemKeyOne.className = `sub-menu-exp sub-menu-block`;
        } else {
            lexSubMenuItemKeyOne.className = `sub-menu-none sub-menu-block`;
        }
        lexSubMenuItemKeyOne.innerText = '\u202F';
        lexSubMenuItem.appendChild(lexSubMenuItemKeyOne);

        let lexSubMenuItemKey = document.createElement("span");
        lexSubMenuItemKey.className = `sub-menu-${val.type} sub-menu-block`;
        lexSubMenuItemKey.innerText = '\u202F';
        lexSubMenuItem.appendChild(lexSubMenuItemKey);

        let menuText = val.name;
        if (val.type == "var") {
            menuText = `the var ${term}`;
        }
        if (val.type == "digit") {
            menuText = `0o${val.name}`;
        }
        menuText = menuText.replace(/_/g, " ");
        let lexSubMenuItemText = document.createTextNode(menuText);
        lexSubMenuItem.appendChild(lexSubMenuItemText);

        if (val.params.length > 0) {
            let openBracket = document.createTextNode(" [ ");
            lexSubMenuItem.appendChild(openBracket);

            for (param in val.params) {
                let lexSubMenuItemParam = document.createElement("span");
                lexSubMenuItemParam.className = `sub-menu-${val.params[param].type} sub-menu-block`;
                lexSubMenuItemParam.innerText = '\u202F';
                lexSubMenuItem.appendChild(lexSubMenuItemParam);
            }
            let closeBracket = document.createTextNode("]");
            lexSubMenuItem.appendChild(closeBracket);
        }

        lexSubMenu.appendChild(lexSubMenuItem);
    }
    lexNode.appendChild(lexSubMenu);

    leftMenu.appendChild(lexNode);
}

const buildControlList = () => {
    for(const [key, value] of Object.entries(Valence.lexicon)) {
        if (key == "to_string") continue;        

        buildButton(key, value.filter(x => x.type=="var")[0].name);

        buildLeftControl(key, value.filter(x => x.type=="var")[0].name, value);
    }
    buildButton("[");
    buildButton("]");
    buildButton("\u21B5");
}

const run_hide_progs = () => {
    if (document.getElementById("hide_nonrun").checked) {
        Array.from(document.getElementsByClassName("failed")).forEach((el) => {
            el.style.display = "none";
        });
    } else {
        Array.from(document.getElementsByClassName("failed")).forEach((el) => {
            el.style.display = "block";
        });
    }
}


const update_display_by_running_state = () => {
    if (is_running) {

    }
}

const report = (progid, line, add_to_output) => {
    // highlight the currently running line of the program and add to output
    rows = Array.from(document.getElementById(`prog-${progid}`).children).filter(x => x.classList.contains("code-row"));

    rows.forEach(x => x.classList.remove("running"));
    rows[line].classList.add("running");
}


// run or stop running programs
const run_stop = (force_start = false, force_end = false) => {
    is_running = !is_running;
    if ((is_running && !force_end) || force_start) {
        document.getElementById("run-stop").value = "Stop All";
    } else {
        document.getElementById("run-stop").value = "Run All";
    }
}
