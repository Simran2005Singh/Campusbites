class HashNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.next = null; // Next node in case of index hash collision (chaining)
  }
}

class HashMap {
  constructor(size = 37) {
    this.buckets = new Array(size).fill(null);
    this.size = size;
  }

  /**
   * Polynomial rolling hash function.
   * Converts a string/numeric key to a bucket index in O(key_length) time.
   */
  hash(key) {
    let hashValue = 0;
    const strKey = String(key);
    for (let i = 0; i < strKey.length; i++) {
      // Use 31 as multiplier constant
      hashValue = (hashValue * 31 + strKey.charCodeAt(i)) % this.size;
    }
    return hashValue;
  }

  /**
   * Puts a key-value pair in the map. Updates if key exists.
   * Runs in O(1) average time.
   */
  put(key, value) {
    const index = this.hash(key);
    let head = this.buckets[index];

    // Search chain for existing key
    while (head !== null) {
      if (head.key === key) {
        head.value = value;
        return;
      }
      head = head.next;
    }

    // Key not found, insert new node at the front of the bucket chain
    const newNode = new HashNode(key, value);
    newNode.next = this.buckets[index];
    this.buckets[index] = newNode;
  }

  /**
   * Gets value by key. Returns null if key is not present.
   * Runs in O(1) average time.
   */
  get(key) {
    const index = this.hash(key);
    let head = this.buckets[index];

    while (head !== null) {
      if (head.key === key) {
        return head.value;
      }
      head = head.next;
    }

    return null;
  }

  /**
   * Checks if key exists.
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Empties the map.
   */
  clear() {
    this.buckets = new Array(this.size).fill(null);
  }
}

module.exports = HashMap;
