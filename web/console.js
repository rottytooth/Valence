var program = "";
var curr_line = "";
var hit_return = false;
var lex_array = [];
var prev_state = [];

let gen_programs = null;

// let is_running = false;

TOKEN_TYPES = {
    "c": "cmd",
    "e": "exp",
    "v": "var",
    "d": "digit",
    "t": "type",
    "m": "meta_exp"
}

document.addEventListener('DOMContentLoaded', function() {
    buildControlList();

    let editor = document.getElementById("program-text");
    editor.focus();
    editor.addEventListener("input", updateInput);

    Valence.interpreter.print_callback = print_callback;
    Valence.interpreter.input_callback = input_callback;

    // We now start with all of them open
    // document.querySelectorAll(".menu-item")[4].classList.add("open");

    // document.getElementById("additional-controls").innerText = Valence.interpreter.node_delay;
}, false);

const setIntSpeed = () => {
    let speed = document.getElementById("speed_select").value;
    Valence.interpreter.node_delay = speed;
}

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
    let pos = txt.selectionStart;
    if (txt.value !== outprog) {
        txt.value = outprog;
        txt.setSelectionRange(pos + 1, pos + 1);    
    }
    run_stop(false, true);
    generateInterpretations();
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

const generateInterpretations = () => {
    let txt = document.getElementById("program-text");
    let run_holder = document.getElementById("programs-running");
    run_holder.innerText = ""; // clear it

    intpt_msg = document.getElementById("intpt-msg");
    intpt_msg.style.fontWeight = "normal";

    intpt_msg.innerText = "0 interpretations";

    try {
        gen_programs = Valence.parser.parse(txt.value, true);
    } catch (e) {
        if (e.name == "SyntaxError" && e.message.includes("too many interpretations")) {
            intpt_msg.innerText = "Too many interpretations";
            intpt_msg.style.fontWeight = "bold";
        }
        return;
    }

    let runnable = gen_programs.length - gen_programs.filter(x => x.failed === true).length;
    if (!runnable) runnable = 0; // for NaN, undefined, etc.

    intpt_msg.innerText = `${gen_programs.length} interpretation${gen_programs.length === 1 ? "" : "s"}, ${runnable} runnable`;

    let indent_lvl = 0;

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

            if (line.reading.name == "end_block") {
                indent_lvl--;
            }

            let char_block = document.createElement("span");
            char_block.style.marginLeft += indent_lvl * 35 + "px";

            for (let j = 0; j < line.reading.pseudo.length; j++) {
                if (line.reading.pseudo.charCodeAt(j) > 50000) {
                    // we can assume is a Valence character
                    reading_node.appendChild(char_block);
                    let val_block = document.createElement("span");
                    val_block.innerText += line.reading.pseudo[j];
                    val_block.className = "valence-char";
                    reading_node.appendChild(val_block);
                    char_block = document.createElement("span");
                } else {
                    char_block.innerText += line.reading.pseudo[j];
                }
            }
            reading_node.appendChild(char_block);
            // reading_node.innerText = line.reading.pseudo;
            reading_node.className = "js-code";
            code_row.appendChild(reading_node);

            run.appendChild(code_row);

            if (["while","if","while_queue"].includes(line.reading.name)) {
                indent_lvl++;
            }

        }

        if (add_run) {
            bigrun.appendChild(run);
            run_holder.appendChild(bigrun);

            let output = document.createElement("div");
            output.className = "output";
            output.innerText = "Output";
            output.style.width = (run.offsetWidth - 16) + "px";
            bigrun.appendChild(output);

            let input = document.createElement("div");
            input.className = "output";
            input.innerText = "Input";
            input.style.width = (run.offsetWidth - 16) + "px";
            bigrun.appendChild(input);

            let status = document.createElement("div");
            status.className = "status";
            status.style.width = (run.offsetWidth - 16) + "px";
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

    unfailedOuterBlocks.forEach(x => Array.from(x.children).filter(x => x.classList.contains("status"))[0].style.backgroundColor = "var(--state-back)");
}

function insertTextAtCursor(textareaId, text) {
    const textarea = document.getElementById(textareaId);
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;

    if (text == '↵') {
        text = '\n';
    }
  
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
        if (typedas) {
            bracket1.textContent = "[";
            bracket1.className = "control-lt";
            controlKey.appendChild(bracket1);

            controlKey.appendChild(document.createTextNode(typedas));

            let bracket2 = document.createElement("span");
            bracket2.textContent = "]";
            bracket2.className = "control-lt";
            controlKey.appendChild(bracket2);
        } else {
            controlKey.appendChild(document.createTextNode("\u00A0"));
        }

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
    lexNode.classList.add("open"); // NOTE: for now, starting with ALL open
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
            menuText = `the var ${term}`; // FIXME: font should change for term
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
    buildButton("[", null);
    buildButton("]", null);
    buildButton("\u21B5", null);
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

// callback function for interpreter
// updates state in the ui
const report = (progid, line, state) => {

    if (gen_programs === undefined || gen_programs === null) {
        console.error("InterfaceError: No program to report on");
        run_stop(false, true);
        return;
    }
    // highlight the currently running line of the program and add to output
    rows = Array.from(document.getElementById(`prog-${progid}`).children).filter(x => x.classList.contains("code-row"));

    rows.forEach(x => x.classList.remove("running"));

    // get status pane
    // NOTE: this depends on not changing the div structure
    // Assumes that the prog-0, prog-1 code-block is sibling to its status div
    let outerCodeBlock = document.getElementById(`prog-${progid}`).parentElement;
    let statArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("status"));
    if (statArray.length == 0) {
        console.error("InterfaceError: Could not find status pane for program");
        return;
    }
    let status = statArray[0];
    status.innerHTML = "";

    let state_lbl = document.createElement("div");
    state_lbl.innerText = "State";
    state_lbl.className = "status-label";
    status.appendChild(state_lbl);

    // FIXME: The interpreter ought to return which values are assigned to, even if they are assigned what they already have, rather than doing this comparison
    if (line === -1 && !state && prev_state[progid] === undefined) {
        state = Valence.interpreter.initial_state();
        prev_state[progid] = Valence.interpreter.initial_state();
    }

    for (let st = 0; st < state.length; st++) {
        let state_item = document.createElement("span");
        state_item.className = "status-item";

        let state_var = document.createElement("span");
        state_var.className = "status-item-var";
        state_var.innerText += lex_array[st];
        state_item.appendChild(state_var);

        let separator = document.createTextNode(":");
        state_item.appendChild(separator);

        state_value = document.createElement("span");
        if (state[st])
            state_value.innerText = state[st].toDisplay();
        state_value.className = "status-item-value";

        // compare state to previous
        if (Object.hasOwn(prev_state,progid) && prev_state[progid][st] !== undefined && typeof(prev_state[progid][st]) == typeof(state[st]) && prev_state[progid][st].toString() !== state[st].toString()) {
            // state_value.className = "status-item-value-changed";
            state_item.classList.add("status-changed-outline");
        }
        state_item.appendChild(state_value);
        status.appendChild(state_item);
    }

    if (line > -1) {
        rows[line].classList.add("running");
    }

    prev_state[progid] = state.slice();
}

const print_callback = (progid, content) => {
    let outerCodeBlock = document.getElementById(`prog-${progid}`).parentElement;
    let outArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("output"));
    let out_txt = Array.from(outArray[0].children).filter(x => x.classList.contains("output-text"));
    if (out_txt.length == 0) {
        console.error(`InterfaceError: Could not find output for program ${progid}`);
    } else {
        out_txt[0].innerText += content;
    }
}

var ret_val = [];

const input_callback = async (progid) => {
    let outerCodeBlock = document.getElementById(`prog-${progid}`).parentElement;
    let outArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("output"));
    let in_txt = Array.from(outArray[1].children).filter(x => x.classList.contains("input-text"));
    if (in_txt.length == 0) {
        console.error(`InterfaceError: Could not find input for program ${progid}`);
    } else {
        let in_btn = Array.from(outArray[1].children).filter(x => x.classList.contains("input-btn"));
        in_txt.disabled = false;
        in_btn.disabled = false;
        in_txt.onkeydown = (e) => {
            if(e.key === 'Enter') {
                in_btn.click();
            }
        };

        const timeout = async ms => new Promise(res => setTimeout(res, ms));
        ret_val = false;
        in_btn.onclick = async () => {
            in_txt.disabled = true;
            in_btn.disabled = true;
            ret_val[progid] = in_txt.value;
            in_txt.value = "";
        }
        await waitUserInput(timeout, ret_val);
        return ret_val;
    }
}

const waitUserInput = async (timeout, ret_val) => {
    while (ret_val === false) await timeout(50); // pauses script
}

// run or stop running programs
const run_stop = (force_start = false, force_end = false) => {
    Valence.interpreter.is_playing = !Valence.interpreter.is_playing;
    prev_state = [];

    if ((Valence.interpreter.is_playing && !force_end) || force_start) {

        if (gen_programs == null) {
            return;
        }

        document.getElementById("run-stop").value = "Stop All";

        let runnable_progs = gen_programs.filter(x => !Object.hasOwn(x,"failed") || x.failed !== true);

        setTimeout(() => {
            Valence.interpreter.launch_all(runnable_progs, report).then(d => {
                run_stop(false, true);
            });
        }, 10); // give a moment to draw the programs

        for (let i = 0; i < runnable_progs.length; i++) {
            let prog = runnable_progs[i];
            // get status pane
            // NOTE: this depends on not changing the div structure
            // Assumes that the prog-0, prog-1 code-block is sibling to its status div
            let outerCodeBlock = document.getElementById(`prog-${prog.id}`).parentElement;

            let outArray = Array.from(outerCodeBlock.children).filter(x => x.classList.contains("output"));
            if (outArray.length == 0) {
                console.error("InterfaceError: Could not find output pane for program");
                return;
            }
            let output = outArray[0];
            output.style.display = "block";
            output.innerHTML = "";

            let output_lbl = document.createElement("div");
            output_lbl.className = "output-label";
            output_lbl.innerText = "Output";
            output.appendChild(output_lbl);

            let out_txt = document.createElement("pre");
            out_txt.className = "output-text";
            output.appendChild(out_txt);


            let input = outArray[1];
            input.style.display = "block";
            input.innerHTML = "";

            let input_lbl = document.createElement("div");
            input_lbl.className = "output-label";
            input_lbl.innerText = "Input";
            input.appendChild(input_lbl);

            let input_brk = document.createElement("br");
            input.appendChild(input_brk);

            let in_txt = document.createElement("input");
            in_txt.type = "text";
            in_txt.className = "input-text";
            in_txt.disabled = true;
            input.appendChild(in_txt);

            let in_btn = document.createElement("input");
            in_btn.type = "button";
            in_btn.className = "input-btn";
            in_btn.textContent = "&nbsp; &nbsp;";
            in_btn.disabled = true;
            input.appendChild(in_btn);
        }    
    } else {
        document.getElementById("run-stop").value = "Run All";
    }
}
