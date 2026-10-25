// How ambiguous is Valence? Parses every possible line of one sign up to MAX signs (no brackets),
// and counts how many lines have each number of readings, by line length.
// After Jeremy Douglass's survey in the Critical Code Studies Working Group:
// https://wg.criticalcodestudies.com/index.php?p=/discussion/190/hai-bye-syntactic-ambiguity-in-valence
//
//   node tools/readings_chart.js            a text table, lines of 1 to 5 signs
//   node tools/readings_chart.js 4          lines of 1 to 4 signs
//   node tools/readings_chart.js 5 --html   an HTML table
//   node tools/readings_chart.js 3 --one    also list the lines with exactly one reading
//
// Each extra sign multiplies the lines by eight: 5 signs is 37,448 lines (about half a minute); 6 is 299,592.

const parser = require('../valence.parser');
const lexicon = require('../valence.lexicon');

const args = process.argv.slice(2);
const max = parseInt(args.find(a => /^\d+$/.test(a)) || "5");
const as_html = args.includes("--html");
const list_one = args.includes("--one");

const signs = Object.keys(lexicon).filter(k => typeof lexicon[k] !== "function");

// readings of a line, as the interpreter's editor counts them
const count_readings = (line) => {
    try {
        return parser.parse(line, false)[0].asts.length;
    } catch (e) {
        return 0; // too many interpretations, etc.
    }
};

// counts[length][readings] = number of lines
const counts = [];
const single = [];
let lines = [""];
for (let length = 1; length <= max; length++) {
    lines = lines.flatMap(line => signs.map(sign => line + sign));
    counts[length] = {};
    single[length] = [];
    for (const line of lines) {
        const n = count_readings(line);
        counts[length][n] = (counts[length][n] || 0) + 1;
        if (n === 1) {
            single[length].push(line);
        }
    }
}

const lengths = [...Array(max).keys()].map(i => i + 1);
const most = Math.max(...lengths.flatMap(length => Object.keys(counts[length]).map(Number)));
const rows = [...Array(most + 1).keys()];
const cell = (length, n) => counts[length][n] ? counts[length][n].toLocaleString("en-US") : "";

if (as_html) {
    const out = [];
    out.push('<table class="readings-chart">');
    out.push('    <thead><tr><th>readings</th>' + lengths.map(l => `<th>${l} sign${l === 1 ? "" : "s"}</th>`).join("") + '</tr></thead>');
    out.push('    <tbody>');
    for (const n of rows) {
        out.push(`        <tr><th>${n}</th>` + lengths.map(l => `<td>${cell(l, n)}</td>`).join("") + '</tr>');
    }
    out.push('    </tbody>');
    out.push('    <tfoot><tr><th>lines</th>' + lengths.map(l => `<td>${(8 ** l).toLocaleString("en-US")}</td>`).join("") + '</tr></tfoot>');
    out.push('</table>');
    console.log(out.join("\n"));
} else {
    const width = 9;
    const pad = (s) => String(s).padStart(width);
    console.log(pad("readings") + lengths.map(l => pad(`${l} sign${l === 1 ? "" : "s"}`)).join(""));
    for (const n of rows) {
        console.log(pad(n) + lengths.map(l => pad(cell(l, n))).join(""));
    }
    console.log(pad("lines") + lengths.map(l => pad((8 ** l).toLocaleString("en-US"))).join(""));
}

if (list_one) {
    for (const length of lengths) {
        console.log(`\n${single[length].length} line${single[length].length === 1 ? "" : "s"} of ${length} sign${length === 1 ? "" : "s"} with one reading:`);
        console.log(single[length].join(" "));
    }
}
