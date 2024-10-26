# Valence

*Valence* is a programming language where every symbol is a homophone with multiple meanings. 

Context determines the meaning of the symbol when possible, but if multiple readings remain, each plays out in parallel.

In Valence:
* Any symbol can alternately be a variable name or an instruction
* All instructions have multiple meanings, as listed below
* Instructions can be combined in any order in a line of code
* Every possible reading of that line of code plays out, resulting in many parallel executions of any program. Some programs get stuck in infinite loops or can't be executed because of syntax errors; if detectable, these programs are not built. The others are treated equally, and run in parallel.

While any symbols can be succesfully combined to create *some* meaning, not all lines of code are compatible: unclosed blocks of code are ignored, until that program has the appropriate close block instruction added. 

## Instructions

Each instruction is a single letter, borrowed from Ancient Greek numbering and measuring signs. While there is some association between some borrowed signs and usage, they all mean something significantly different in Valence.

symbol | var name | meanings |
---|---|---|
𐅶 | q | the octal (base eight) digit 0, the variable 𐅶, integer, not, add, addition assignment
𐆇 | w | the octal digit 1, the variable 𐆇, subtract, if, subtraction assignment, a movement toward entropy, loop with iterator
𐅾 | e | the octal digit 2, the variable 𐅾, divide, a ratio, the end of a block, the and operator, calculated goto, and a reserved (currently unassigned) expression with a single parameter
𐆋 | a | the octal digit 3, the variable 𐆋, convert to string, equals, print, while loop, do while
𐆉 | s | the octal digit 4, string type, null, convert to integer, floor, read as a value, declare label, assign to a variable
𐅻 | d | the octal digit 5, the variable 𐅻, char type, modulo, jump (a relative goto), an expression with one parameter left for future development
𐆊 | z | the octal digit 6, is greater than zero, or, else, else if, assign to a variable
𐆁 | x | the octal digit 7, the variable 𐆁, random number, multiply, multiply assignment, input from another process
[ | [ | open bracket: begins a lexical unit
] | ] | close bracket: closes a lexical unit

## Example Programs

### Hello World

There is only one reading of this Hello World program, since the 𐆉 has no alternate readings in this context:

    𐆋Hello, World!

No quotes are needed, as any characters from outside the Valence lexicon are treated as a string. If quotes had been included, those quotes would have been interpreted as part of the string.

### FizzBuzz

Even a simple loop adds much ambiguity. Since Ints and Floats are formed using the 𐆋 instructions, each ends up with several alternate values:

    (TO BE ADDED)

A few readings of this program:

    (TO BE ADDED)
