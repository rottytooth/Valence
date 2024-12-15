var program = "";
var curr_line = "";
var hit_return = false;

document.addEventListener('DOMContentLoaded', function() {
    buildControlList();

    let editor = document.getElementById("program-text");
    editor.focus();
    editor.addEventListener("input", updateInput);
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
    processProgram();
}

const processProgram = () => {
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

        let add_run = true;
        for (let i = 0; i < prog[r].length; i++) {
            if (i > 0) {
                intrpt.innerHTML += "<br/>";
            }
            if (prog[r][i].reading.js === undefined) {
                add_run = false;
            }
            reading_node = document.createTextNode(prog[r][i].reading.js);
            intrpt.appendChild(reading_node);
        }
        run.appendChild(intrpt);

        if (add_run) {
            run_holder.appendChild(run);
        }
    }
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

const buildButton = (term) => {
    let controlList = document.getElementById("lang-insert");

    let addBtn = document.createElement("input");
    addBtn.type = "button";
    addBtn.value = term;
    addBtn.className = "add-btn btn";
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

        if (val.type == "var" || val.type == "digit") {
            let lexSubMenuItemKey = document.createElement("span");
            lexSubMenuItemKey.className = `sub-menu-exp sub-menu-block`;
            lexSubMenuItemKey.innerText = '\u202F';
            lexSubMenuItem.appendChild(lexSubMenuItemKey);
        }

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
