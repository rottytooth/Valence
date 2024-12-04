# Valence

*Valence* is a programming language where each symbol is a homophone with multiple meanings. Context determines the meaning of the symbol; if multiple readings remain, each interpretation plays out in parallel.

In Valence:
* Any symbol can alternately be a variable name or an instruction
* All instructions have multiple meanings, as listed below
* Instructions can be combined in any order in a line of code
* Every possible reading of that line of code plays out, resulting in many parallel executions of any program. Some programs get stuck in infinite loops or can't be executed because of syntax errors; if detectable, these are skipped; the others are treated equally, and run in parallel.

While any symbols can be succesfully combined to create *some* meaning, not all lines of code are compatible: unclosed blocks of code are ignored, until that program has the appropriate close block instruction added. 

## Project Status

The parser is functional but not finalized, as there may be changes to the grammar as testing continues.

IN PROGRESS: 
* Interpreter with parallel execution
* More complex / more representative sample programs
* Transpile to JS instead of pseudo-code

## Instructions

Each instruction is a single letter, borrowed from Ancient Greek numbering and measuring signs. While there is some association between some borrowed signs and usage, they all mean something significantly different in Valence.

symbol | typed as | interpretation | type | params 
---|---|---|---|---|
𐅶 | q | 0 | octal digit | 0
  |  |   |  𐅶 | var | 0
  |  |   | int | type | 0
  |  |   | not | exp | 1 (exp)
  |  |   | add | exp | 2 (exp, exp)
  |  |   | while | cmd | 1 (exp)
  |  |   | add_assign | cmd | 2 (var, exp)
𐆇 | w | 1 | octal digit | 0
  |  |  | 𐆇 | var | 0
  |  |  | to_int | exp | 1 (digit)
  |  |  | sub | exp | 2 (exp, exp)
  |  |  | if | cmd | 1 (exp)
  |  |  | sub_assign | cmd | 2 (var, exp)
𐅾 | e | 2 | octal digit | 0
  |  |  | 𐅾 | var | 0
  |  |  | ratio | type | 0
  |  |  | read_as_var | exp | 1 (var)
  |  |  | div | exp | 2 (exp, exp)
  |  |  | end block | cmd | 0
  |  |  | goto | cmd | 1 (exp)
  |  |  | randomize | cmd | 2 (var, range)
𐆋 | a | 3 | octal digit | 0
  |  |  | 𐆋 | var | 0
  |  |  | to_str | exp | 1 (exp)
  |  |  | equals | exp | 2 (exp, exp)
  |  |  | print | cmd | 1 (exp)
  |  |  | for | cmd | 2 (var, range)
𐆉 | s | 4 | octal digit | 0
  |  |  | string | type | 0
  |  |  | null | exp | 0
  |  |  | int_or_floor | exp | 1 (exp)
  |  |  | value | exp | 2 (type, exp)
  |  |  | label | cmd | 1 (var)
  |  |  | assign | cmd | 2 (var, exp)
𐅻 | d | 5 | octal digit | 0
  |  |  | 𐅻 | var | 0
  |  |  | char | type | 0
  |  |  | mod | exp | 2 (exp, exp)
  |  |  | jump | cmd | 1 (exp)
  |  |  | append | cmd | 2 (var, exp)
𐆊 | z | 6 | octal digit | 0
  |  |  | 𐆊 | var | 0
  |  |  | greater_zero | exp | 1 (exp)
  |  |  | or | exp | 2 (exp, exp)
  |  |  | else | cmd | 0
  |  |  | else_if | cmd | 1 (exp)
  |  |  | assign | cmd | 2 (var, exp)
𐆁 | x | 7 | octal digit | 0
  |  |  | 𐆁 | var | 0
  |  |  | random | exp | 1 (range)
  |  |  | mul | exp | 2 (exp, exp)
  |  |  | input | cmd | 1 (var)
  |  |  | mul_assign | cmd | 2 (var, exp)
[ | [ | begin lexical group
] | ] | end lexical group

## Example Programs

### Hello World (with single interpretation)

```
[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐆇]]]]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐅶[[𐅻[𐆇𐆋]]𐅶[𐆇𐅻]]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐅶[[𐅻[𐆇𐆇]]𐅶[𐆇𐆇]]
[𐅶]𐅶[𐅾𐆋]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐅶[𐆇𐆋]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆉]𐆉[𐅻[𐆇𐆉]]
[𐅶]𐅶[𐅾𐆉]
[𐅾𐆁]𐆉[[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐅾]]]𐅶[𐆇𐆁]]
[𐅶]𐅶[𐅾𐆁]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐅶[𐆇𐆋]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐆇[[𐅻[𐆇𐆇]]𐅶[𐆇𐅾]]
[𐅶]𐅶[𐅾𐆋]
[𐅾𐆋]𐆇[𐅻[𐆇𐆇]]
[𐅶]𐅶[𐅾𐆋]
𐆋[𐅾𐅶]
```
