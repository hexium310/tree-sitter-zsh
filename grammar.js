const bashGrammar = require('tree-sitter-bash/grammar');

module.exports = grammar(bashGrammar, {
  name: 'zsh',
});
