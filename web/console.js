var program = "";
var curr_line = "";
var hit_return = false;
var lex_array = [];

let gen_programs = null;

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
    let run_holder = document.getElementById("programs-running");
    run_holder.innerText = ""; // clear it

    try {
        gen_programs = Valence.parser.parse(txt.value, true);
    } catch (SyntaxError) {
        return;
    }

    let runnable = gen_programs.length - gen_programs.filter(x => x.failed === true).length;
    if (!runnable) runnable = 0; // for NaN, undefined, etc.

    intpt_msg = document.getElementById("intpt-msg");
    intpt_msg.innerText = `${gen_programs.length} interpretation${gen_programs.length === 1 ? "" : "s"}, ${runnable} runnable`;

    for (let r = 0; r < gen_programs.length; r++) {
        let bigrun = document.createElement("div");
        bigrun.classList += "outer-code-block";

        let run = document.createElement("div");
        run.id = `prog-${gen_programs[r].id}`;
        run.classList += "code-block";
        if (gen_programs[r].failed === true) {
            run.classList += " failed";
        }
        
        let add_run = true;
        for (let i = 0; i < gen_programs[r].length; i++) {
            // for lines in the program
            let line = gen_programs[r][i];

            let code_row = document.createElement("div");
            code_row.className = "code-row";
            if (gen_programs[r].failed === true && gen_programs[r].length > 1 && gen_programs[r].bad_line === i) {
                code_row.classList += " row-failed";
            }
        
            line_node = document.createElement("div");
            sytaxHighlight(line, line_node);
            line_node.className = "valence-code";
            code_row.appendChild(line_node);

            if (line.reading.pseudo === undefined) {
                add_run = false;
                break;
            }

            reading_node = document.createElement("div");
            reading_node.innerText = line.reading.pseudo;
            reading_node.className = "js-code";
            code_row.appendChild(reading_node);

            run.appendChild(code_row);
        }

        if (add_run) {
            bigrun.appendChild(run);
            run_holder.appendChild(bigrun);

            let output = document.createElement("div");
            output.className = "output";
            output.innerText = "Output";
            output.style.width = run.offsetWidth + "px";
            bigrun.appendChild(output);

            let status = document.createElement("div");
            status.className = "status";
            status.style.width = run.offsetWidth + "px";
            bigrun.appendChild(status);
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

    unfailedOuterBlocks.forEach(x => Array.from(x.children).filter(x => x.classList.contains("status"))[0].style.backgroundColor = "var(--code-run-back)");
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
        lex_array.push(key);

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
            el.parentElement.style.display = "none";
        });
    } else {
        Array.from(document.getElementsByClassName("failed")).forEach((el) => {
            el.parentElement.style.display = "block";
        });
    }
}


// const update_display_by_running_state = () => {
//     if (is_running) {

//     }
// }

// callback function for interpreter
// updates state in the ui
const report = (progid, line, add_to_output, state) => {

    if (gen_programs === undefined || gen_programs === null) {
        console.error("No program to report on");
        run_stop(false, true);
        return;
    }
    // highlight the currently running line of the program and add to output
    rows = Array.from(document.getElementById(`prog-${progid}`).children).filter(x => x.classList.contains("code-row"));

    rows.forEach(x => x.classList.remove("running"));

    // get status pane
    // NOTE: this depends very closely on not changing the div structure here
    // assumption is that the prog-0, prog-1 code-block is sibling to its status div
    let outerCodeBlock = document.getElementById(`prog-${progid}`).parentElement;
    let statArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("status"));
    if (statArray.length == 0) {
        console.error("Could not find status pane for program");
        return;
    }
    let status = statArray[0];
    status.innerHTML = "";

    let outArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("output"));
    if (outArray.length == 0) {
        console.error("Could not find output pane for program");
        return;
    }
    let output = outArray[0];
    output.style.display = "block";
    output.innerHTML = "";

    for (let st = 0; st < state.length; st++) {
        let stat_holder = document.createElement("span");
        stat_holder.className = "status-item";
        // if (st == 4) {
        //     status.appendChild(document.createElement("br"));
        // }
        stat_holder.innerText += `${lex_array[st]}: ${state[st]} `;
        status.appendChild(stat_holder);
    }

    if (line > -1) {
        rows[line].classList.add("running");
    }

    if (add_to_output) {
        console.log(add_to_output);
    }
}


// run or stop running programs
const run_stop = (force_start = false, force_end = false) => {
    is_running = !is_running;
    if ((is_running && !force_end) || force_start) {
        document.getElementById("run-stop").value = "Stop All";

        let runnable_progs = gen_programs.filter(x => !Object.hasOwn(x,"failed") || x.failed !== true);

        Valence.interpreter.launch_all(runnable_progs, report).then(d => {
            run_stop(false, true);
        });
    } else {
        document.getElementById("run-stop").value = "Run All";
    }
}
