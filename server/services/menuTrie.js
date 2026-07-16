const Trie = require('../utils/Trie');

// Global Trie instance shared across requests
const menuTrie = new Trie();

module.exports = menuTrie;
