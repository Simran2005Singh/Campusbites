class TrieNode {
  constructor() {
    this.children = {}; // Character map -> TrieNode
    this.isEndOfWord = false;
    this.items = []; // List of full menu item objects terminating at this node
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Inserts a menu item into the Trie by its name.
   * To support multi-word search (e.g., searching "Burger" for "Paneer Tikka Burger"),
   * we index the full name and suffix sub-phrases.
   */
  insert(word, item) {
    if (!word || !item) return;
    const cleanWord = word.trim().toLowerCase();

    // Generate suffixes for indexing
    // E.g., "Paneer Tikka Burger" indexes:
    // 1. "paneer tikka burger"
    // 2. "tikka burger"
    // 3. "burger"
    const suffixes = [];
    suffixes.push(cleanWord);

    const tokens = cleanWord.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      suffixes.push(tokens.slice(i).join(' '));
    }

    for (const suffix of suffixes) {
      let node = this.root;
      for (const char of suffix) {
        if (!node.children[char]) {
          node.children[char] = new TrieNode();
        }
        node = node.children[char];
      }
      node.isEndOfWord = true;

      // Add item to items array if it's not already indexed under this node
      if (!node.items.some(existing => existing.id === item.id)) {
        node.items.push(item);
      }
    }
  }

  /**
   * Performs an autocomplete prefix search returning list of matching menu items.
   * Runs in O(L + V) where L is prefix length, and V is sub-tree nodes checked.
   */
  search(prefix) {
    if (!prefix) return [];
    const cleanPrefix = prefix.trim().toLowerCase();
    let node = this.root;

    // Traverse to the prefix node
    for (const char of cleanPrefix) {
      if (!node.children[char]) {
        return []; // Prefix not found
      }
      node = node.children[char];
    }

    // Prefix node matched. Run DFS to collect all items under this sub-tree
    const results = [];
    const visitedIds = new Set();

    const dfs = (currentNode) => {
      if (currentNode.isEndOfWord) {
        for (const item of currentNode.items) {
          if (!visitedIds.has(item.id)) {
            visitedIds.add(item.id);
            results.push(item);
          }
        }
      }
      for (const char in currentNode.children) {
        dfs(currentNode.children[char]);
      }
    };

    dfs(node);
    return results;
  }

  /**
   * Removes a menu item from the Trie by its name.
   */
  remove(word, itemId) {
    if (!word) return;
    const cleanWord = word.trim().toLowerCase();

    const suffixes = [];
    suffixes.push(cleanWord);

    const tokens = cleanWord.split(/\s+/);
    for (let i = 1; i < tokens.length; i++) {
      suffixes.push(tokens.slice(i).join(' '));
    }

    for (const suffix of suffixes) {
      this._removeNode(this.root, suffix, 0, itemId);
    }
  }

  _removeNode(node, word, index, itemId) {
    if (!node) return false;

    if (index === word.length) {
      if (node.isEndOfWord) {
        // Remove item matching ID
        node.items = node.items.filter(item => item.id !== itemId);
        if (node.items.length === 0) {
          node.isEndOfWord = false;
        }
      }
      // If node has no children and is no longer end of word, it can be deleted
      return Object.keys(node.children).length === 0 && !node.isEndOfWord;
    }

    const char = word[index];
    const nextNode = node.children[char];
    const shouldDeleteChild = this._removeNode(nextNode, word, index + 1, itemId);

    if (shouldDeleteChild) {
      delete node.children[char];
      return Object.keys(node.children).length === 0 && !node.isEndOfWord;
    }

    return false;
  }
}

module.exports = Trie;
