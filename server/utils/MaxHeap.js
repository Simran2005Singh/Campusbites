class MaxHeap {
  constructor() {
    this.heap = [];
  }

  /**
   * Helper to swap elements in heap array.
   */
  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  /**
   * Pushes a food sales object into the Heap and bubble-ups.
   * Runs in O(log N) time.
   */
  insert(element) {
    // Element format: { id, name, sales_count }
    this.heap.push(element);
    this._heapifyUp(this.heap.length - 1);
  }

  /**
   * Pops and returns the item with the highest sales count.
   * Runs in O(log N) time.
   */
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);
    return max;
  }

  /**
   * Bubble element up if parent sales_count is smaller.
   */
  _heapifyUp(index) {
    if (index === 0) return;

    const parentIndex = Math.floor((index - 1) / 2);
    if (this.heap[index].sales_count > this.heap[parentIndex].sales_count) {
      this._swap(index, parentIndex);
      this._heapifyUp(parentIndex);
    }
  }

  /**
   * Bubble element down to children if child sales_count is larger.
   */
  _heapifyDown(index) {
    const leftChildIndex = 2 * index + 1;
    const rightChildIndex = 2 * index + 2;
    let largestIndex = index;

    if (
      leftChildIndex < this.heap.length &&
      this.heap[leftChildIndex].sales_count > this.heap[largestIndex].sales_count
    ) {
      largestIndex = leftChildIndex;
    }

    if (
      rightChildIndex < this.heap.length &&
      this.heap[rightChildIndex].sales_count > this.heap[largestIndex].sales_count
    ) {
      largestIndex = rightChildIndex;
    }

    if (largestIndex !== index) {
      this._swap(index, largestIndex);
      this._heapifyDown(largestIndex);
    }
  }

  /**
   * Returns current heap size.
   */
  size() {
    return this.heap.length;
  }

  /**
   * Peeks the maximum value without removing it.
   */
  peek() {
    if (this.heap.length === 0) return null;
    return this.heap[0];
  }
}

module.exports = MaxHeap;
