const bashGrammar = require('tree-sitter-bash/grammar');

module.exports = grammar(bashGrammar, {
  name: 'zsh',
  inline: ($, previous) => [
    ...previous,
    $._expression_literal,
  ],
  conflicts: ($, previous) => [
    ...previous,
  ],
  precedences: ($, previous) => [
    ...previous,
    [$._subscript, $._expression2],
    [
      $._subscript,
      'unary',
      'literal',
      'bitwiseShift',
      'bitwiseAnd',
      'bitwiseXor',
      'bitwiseOr',
      'exponentiation',
      'multiplicationDivisionModulus',
      'additionSubtraction',
      'comparison',
      'equalityInequality',
      'logicalAnd',
      'logicalOrLogicalXor',
      'ternary',
      'assignment',
      'comma',
    ],
  ],
  rules: {
    number: $ => token(prec(1, seq(
      optional('-'),
      /\d+/,
    ))),
    glob: $ => prec(-1, repeat1(
      choice (
        seq(
          '[',
          repeat(choice(
            /\\[\[\]\(\)\\]/,
            /[^\[\]\(\)\\]/,
          )),
          ']'
        ),
        /\\[\[\]\(\)\\]/,
        /[^\[\]\(\)\\]/,
      )
    )),
    subscript: $ => seq(
      $.variable_name,
      $._subscripting,
    ),
    expansion: $ => seq(
      '${',
      optional(
        seq(
          '(',
          alias(repeat($._parameter_expansion_flag), $.parameter_expansion_flag),
          ')',
        ),
      ),
      optional($.parameter_expansion_prefix),
      optional(seq(
        choice(
          $._simple_variable_name,
          $._special_variable_name,
          $.expansion,
          $.string,
          $.command_substitution,
        ),
        repeat($._subscripting),
        optional($.parameter_expansion_suffix),
      )),
      '}',
    ),
    parameter_expansion_prefix: $ => token.immediate(prec.left(2, choice(
      seq(
        repeat1(choice('^', '=', '~')),
        optional(choice('#', '+')),
      ),
      seq(
        repeat(choice('^', '=', '~')),
        choice('#', '+'),
      ),
    ))),
    parameter_expansion_suffix: $ => choice(
      seq(
        choice(
          '#',
          '##',
          '%',
          '%%',
          ':#',
        ),
        optional(choice(
          $._literal,
          $.regex,
        )),
      ),
      seq(
        choice(
          ':|',
          ':*',
          ':^',
          ':^^',
        ),
        optional($.word),
      ),
      seq(
        choice(
          '-',
          ':-',
          '+',
          ':+',
          '=',
          ':=',
          '::=',
          '?',
          ':?',
        ),
        optional($._literal),
      ),
      seq(
        ':',
        optional(
          seq(
            $._expression2,
            optional(seq(':', $._expression2)),
          ),
        ),
      ),
      seq(
        choice('/', '//', ':/'),
        choice(
          $._literal,
          $.regex,
        ),
        optional(seq('/', $._literal)),
      ),
    ),
    _subscripting: $ => seq(
      '[',
      field('index1', alias($._subscript, $.subscript)),
      optional(
        seq(
          ',',
          field('index2', alias($._subscript, $.subscript)),
        ),
      ),
      ']',
    ),
    _subscript: $ => choice(
      seq(
        '(',
        alias(repeat($._subscript_flag), $.subscript_flag),
        ')',
        choice(
          $._expression2,
          alias(choice('@', '*'), $.special_subscript),
        ),
      ),
      seq(
        '(',
        alias($._subscript_flags_with_using_pattern, $.subscript_flag),
        ')',
        repeat(
          choice(
            $.expansion,
            $.simple_expansion,
            $.glob,
          ),
        ),
      ),
      $._expression2,
      alias(choice('@', '*'), $.special_subscript),
    ),
    _expression2: $ => prec.left(choice(
      $._expression_literal,
      alias($._unary_expression2, $.unary_expression),
      alias($._binary_expression2, $.binary_expression),
      alias($._ternary_expression2, $.ternary_expression),
      alias($._parenthesized_expression2, $.parenthesized_expression),
    )),
    _unary_expression2: $ => choice(
      prec.right('unary', seq(
        choice(
          '+', '-', '!', '~',
        ),
        $._expression2,
      )),
      prec.left('unary', seq(
        choice('++', '--'),
        $._expression2,
      )),
      prec.right('unary', seq(
        $._expression2,
        choice('++', '--'),
      )),
    ),
    _binary_expression2: $ => choice(
      ...Object.entries({
        bitwiseShift: ['<<', '>>'],
        bitwiseAnd: ['&'],
        bitwiseXor: ['^'],
        bitwiseOr: ['|'],
        exponentiation: ['**'],
        multiplicationDivisionModulus: ['*', '/', '%'],
        additionSubtraction: ['+', '-'],
        comparison: ['<', '>', '<=', '>='],
        equalityInequality: ['==', '!='],
        logicalAnd: ['&&'],
        logicalOrLogicalXor: ['||', '^^'],
        comma: [',']
      }).map(([precedence, operators]) => {
        return prec.left(precedence, seq(
          field('left', $._expression2),
          field('operator', choice(...operators)),
          field('right', $._expression2),
        ));
      }),
    ),
    _ternary_expression2: $ => prec.left('ternary',
      seq(
        field('condition', $._expression2),
        '?',
        field('consequence', $._expression2),
        ':',
        field('alternative', $._expression2),
      ),
    ),
    _parenthesized_expression2: $ => seq(
      '(',
      $._expression2,
      ')'
    ),
    _expression_literal: $ => choice(
      repeat1(prec.left('literal', choice(
        $.expansion,
        $.simple_expansion,
        $.number,
        $._simple_variable_name2,
        $._special_variable_name,
      ))),
    ),
    _identifier: $ => seq(
      /[A-Za-z_]/,
      /\w*/,
    ),
    _simple_variable_name2: $ => alias($._identifier, $.variable_name),
    _parameter_expansion_flag: $ => choice(
      /[#%@AabcCDefFiknoOPQtuUvVwWXz0p~mSBEMNR]/,
      /g.[coe]+./,
      /q(q{1,2}|\+)?/,
      /Z.[cCn]+./,
      /_../,
      // TODO: Support using `)` as a separator or a expression
      /[jsI](\)[^)]+\)|[^)]+)/,
      // TODO: Support using `)` as a string which fills spaces
      /[lr][^)]+/,
    ),
    _subscript_flag: $ => choice(
      'w', 'p', 'f', 'k', 'K', 'e',
      // TODO: Support using `)` as a separator or a expression
      /[snb](\)[^)]+\)|[^)]+)/,
    ),
    _subscript_flag_using_pattern: $ => choice(
      'r',
      'R',
      'i',
      'I',
    ),
    // Required to unify a node of subscript flags
    _subscript_flags_with_using_pattern: $ => seq(
      repeat($._subscript_flag),
      $._subscript_flag_using_pattern,
      repeat(choice($._subscript_flag, $._subscript_flag_using_pattern)),
    ),
  },
});
