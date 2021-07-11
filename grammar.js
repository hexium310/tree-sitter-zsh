const bashGrammar = require('tree-sitter-bash/grammar');

module.exports = grammar(bashGrammar, {
  name: 'zsh',
  rules: {
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
      prec.left(3, optional(
        choice(
          $._simple_variable_name,
          $._special_variable_name,
          $.expansion,
          $.string,
          $.command_substitution,
        ),
      )),
      repeat($.expansion_subscript),
      optional($.parameter_expansion_suffix),
      '}',
    ),
    parameter_expansion_prefix: $ => prec.left(2, choice(
      seq(
        repeat1(choice('^', '=', '~')),
        optional(choice('#', '+')),
      ),
      seq(
        repeat(choice('^', '=', '~')),
        choice('#', '+'),
      ),
    )),
    parameter_expansion_suffix: $ => prec(1, choice(
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
    )),
    expansion_subscript: ($, previous) => seq(
      '[',
      repeat1(
        seq(
          optional(
            seq(
              '(',
              $.subscript_flag,
              ')'
            ),
          ),
          field('index', prec(2, $._expression)),
        ),
      ),
      ']',
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
    subscript_flag: $ => choice(
      /[wpfrRiIkKe]/,
      // TODO: Support using `)` as a separator or a expression
      /[snb](\)[^)]+\)|[^)]+)/,
    ),
  },
});
