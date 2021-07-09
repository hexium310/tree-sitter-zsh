#include "../node_modules/tree-sitter-bash/src/scanner.cc"

extern "C" {
  void *tree_sitter_zsh_external_scanner_create() {
    return new Scanner();
  }

  bool tree_sitter_zsh_external_scanner_scan(void *payload, TSLexer *lexer,
      const bool *valid_symbols) {
    Scanner *scanner = static_cast<Scanner *>(payload);
    return scanner->scan(lexer, valid_symbols);
  }

  unsigned tree_sitter_zsh_external_scanner_serialize(void *payload, char *state) {
    Scanner *scanner = static_cast<Scanner *>(payload);
    return scanner->serialize(state);
  }

  void tree_sitter_zsh_external_scanner_deserialize(void *payload, const char *state, unsigned length) {
    Scanner *scanner = static_cast<Scanner *>(payload);
    scanner->deserialize(state, length);
  }

  void tree_sitter_zsh_external_scanner_destroy(void *payload) {
    Scanner *scanner = static_cast<Scanner *>(payload);
    delete scanner;
  }
}
