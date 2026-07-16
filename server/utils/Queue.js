class Queue {
  constructor() {
    this.items = {};
    this.frontIndex = 0;
    this.backIndex = 0;
  }

  /**
   * Pushes an item to the rear of the Queue. Runs in O(1) time.
   */
  enqueue(element) {
    this.items[this.backIndex] = element;
    this.backIndex++;
  }

  /**
   * Removes and returns the front item. Runs in O(1) time.
   */
  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.items[this.frontIndex];
    delete this.items[this.frontIndex];
    this.frontIndex++;
    return item;
  }

  /**
   * Returns front item without removing it. Runs in O(1) time.
   */
  peek() {
    if (this.isEmpty()) return null;
    return this.items[this.frontIndex];
  }

  /**
   * Checks if Queue is empty.
   */
  isEmpty() {
    return this.frontIndex === this.backIndex;
  }

  /**
   * Returns current count of items.
   */
  size() {
    return this.backIndex - this.frontIndex;
  }

  /**
   * Returns contents as a sequential array list for UI rendering.
   */
  getElements() {
    const arr = [];
    for (let i = this.frontIndex; i < this.backIndex; i++) {
      if (this.items[i] !== undefined) {
        arr.push(this.items[i]);
      }
    }
    return arr;
  }

  /**
   * Empties the queue.
   */
  clear() {
    this.items = {};
    this.frontIndex = 0;
    this.backIndex = 0;
  }
}

module.exports = Queue;
