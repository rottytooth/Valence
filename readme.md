# Valence

*Valence* is a programming language where each symbol is a homophone with multiple meanings. Context determines the meaning of the symbol; if multiple readings remain, each interpretation plays out in parallel.

In Valence:
* Any symbol can be read as a variable name, an octal digit, a command, a type, or an expression
* For commands and expressions, most symbols have multiple interpretations based on parameter count
* Every possible reading of a program plays out in parallel
* Brackets can disambiguate a phrase when needed

There is no single line of Valence that isn't valid; any combination of the signs has multiple meanings. However, some programs have mismatched brackets or (detectable) infinite loops; during execution, these are skipped.

## Project Status

Feel free to open issues or add failing tests for anything not already there. Here are the major things still in progress.



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
  |  |  | read_as_digit | exp | 1 (digit)
  |  |  | subtract | exp | 2 (exp, exp)
  |  |  | if | cmd | 1 (exp)
  |  |  | while_queue | cmd | 2 (var, exp)
𐅾 | e | 2 | octal digit | 0
  |  |  | 𐅾 | var | 0
  |  |  | read_as_var | exp | 1 (var)
  |  |  | div | exp | 2 (exp, exp)
  |  |  | end block | cmd | 0
  |  |  | goto | cmd | 1 (exp)
  |  |  | trade_op | cmd | 2 (var, range): CURRENTLY IN PROGRESS
𐆋 | a | 3 | octal digit | 0
  |  |  | 𐆋 | var | 0
  |  |  | queue | type | 0
  |  |  | equals | exp | 2 (exp, exp)
  |  |  | print | cmd | 1 (exp)
  |  |  | input | cmd | 2 (var, type)
𐆉 | s | 4 | octal digit | 0
  |  |  | string | type | 0
  |  |  | int_or_floor | exp | 1 (exp)
  |  |  | cast | exp | 2 (type, exp)
  |  |  | label | cmd | 1 (var)
  |  |  | assign | cmd | 2 (var, exp)
𐅻 | d | 5 | octal digit | 0
  |  |  | 𐅻 | var | 0
  |  |  | char | type | 0
  |  |  | mult_by_eight | exp | 1 (exp) 
  |  |  | get_element (from queue) | exp | 2 (exp, exp)
  |  |  | append | cmd | 2 (var, exp)
𐆊 | z | 6 | octal digit | 0
  |  |  | 𐆊 | var | 0
  |  |  | bool | type | 0
  |  |  | or | exp | 2 (exp, exp)
  |  |  | else | cmd | 0
  |  |  | else_if | cmd | 1 (exp)
𐆁 | x | 7 | octal digit | 0
  |  |  | 𐆁 | var | 0
  |  |  | ratio | type | 0
  |  |  | dequeue | var | 1
  |  |  | mul | exp | 2 (exp, exp)
  |  |  | mul_assign | cmd | 2 (var, exp)
[ | [ | begin lexical group
] | ] | end lexical group

## Example Programs

### Hello World (with single interpretation)

```
[𐆋]𐆉[[𐅻]𐆉[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐆇]]]]
[𐅶]𐆉[𐅾𐆋]
[𐆋]𐅶[[𐅻[𐆇𐆋]]𐅶[𐆇𐅻]]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆁]
[𐅶]𐅻[𐅾𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐅾𐆉]𐆉[𐅻[𐆇𐆉]]
[𐅶]𐅶[𐅾𐆉]
[𐆁]𐆉[[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐅻[𐆇𐅾]]]𐅶[𐆇𐆁]]
[𐅶]𐅻[𐅾𐆁]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐆇𐆋]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐅶[𐆇[𐆊]]]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[𐅶[𐅻[𐆇𐆇]]]
[𐅶]𐅻[𐅾𐆋]
𐆋[𐅾𐅶]
```

### Hai / Bye

This program has two executions, one producing "Hai", the other "Bye":

```
[𐅶]𐆉𐆇𐆇
[𐆉]𐆉[𐆇𐆇]
[𐆁]𐆉[𐅶]
𐅾[𐆇[[𐅾𐆁]𐅶[𐆇𐅻]]]
𐆉[𐅻]
[𐆉]𐅶[[𐆇𐅶]𐆇[𐆇𐅾]]
𐆉[𐆊]
[𐆋]𐆉[[𐅻]𐆉[[[𐅻[𐅻[𐆇𐆇]]]𐅶[𐆇𐅻]]𐅶[[𐅾𐆉]𐆁[𐆇𐆋]]]]
[𐅶]𐆉[𐅾𐆋]
[𐆋]𐅶[𐅻[𐆇𐅻]]
[𐆋]𐅶[[𐆇𐅶]𐆇[[[𐅻[𐆇𐆇]]𐅶[𐆇𐆁]]𐆁[𐅾𐆉]]]
[𐅶]𐅻[𐅾𐆋]
[𐆋]𐅶[[𐆇𐅶]𐆇[𐆇𐆊]]
[𐆋]𐅶[[[𐅻[𐆇𐆇]]𐅶[𐆇𐆊]]𐆁[𐅾𐆉]]
[𐅶]𐅻[𐅾𐆋]
𐆋[𐅾𐅶]
```

The program splits in line 3:

```
𐅶 = 1
𐆉 = 1
𐆁 = 𐅶 (for Bye) | 𐆁 = 0 (for Hai)
goto((𐆁 + 0o5))
set_label(𐅻)
𐆉 += (0 - 0o2)
set_label(𐆊)
𐆋 = cast(char, (0o105 + (𐆉 * 0o3)))
𐅶 = 𐆋
𐆋 += 0o50
𐆋 += (0 - (0o17 * 𐆉))
𐅶 APPEND 𐆋
𐆋 += (0 - 0o6)
𐆋 += (0o16 * 𐆉)
𐅶 APPEND 𐆋
print(𐅶)
```