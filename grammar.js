const bashGrammar = require('tree-sitter-bash/grammar');

module.exports = grammar(bashGrammar, {
  name: 'zsh',
  inline: ($, previous) => [
    ...previous,
    $._expression_literal,
  ],
  conflicts: ($, previous) => [
    ...previous,
    [$._subscript],
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
      $.expansion_subscript,
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
        repeat($.expansion_subscript),
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
            $._expression,
            optional(seq(':', $._expression)),
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
    expansion_subscript: $ => seq(
      '[',
      $._subscript,
      optional(
        seq(
          ',',
          $._subscript,
        ),
      ),
      ']',
    ),
    _subscript: $ => choice(
      seq(
        '(',
        alias(repeat($._subscript_flag), $.subscript_flag),
        ')',
        field('index2', $._expression_literal),
      ),
      seq(
        '(',
        alias($._subscript_flags_with_using_pattern, $.subscript_flag),
        ')',
        field('index', repeat(
          choice(
            $.expansion,
            $.simple_expansion,
            $.glob,
          ),
        )),
      ),
      field('index', $._expression_literal),
    ),
    _expression_literal: $ => choice(
      choice(
        $.number,
        alias(/[A-Za-z_]\w+/, $.variable_name),
        $._special_variable_name,
        alias(choice('@', '*'), $.special_subscript),
      ),
      repeat1(choice(
        seq(
          repeat(choice(
            $.expansion,
            $.simple_expansion,
          )),
          $.expansion,
          choice(
            $.number,
            alias(/[A-Za-z_]\w+/, $.variable_name),
            $._special_variable_name,
          ),
        ),
        prec.right(2, repeat1(choice(
          $.expansion,
          $.simple_expansion,
        ))),
      )),
    ),
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
      /[wpfkKe]/,
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
