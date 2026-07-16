const Stack = require('../utils/Stack');

// Single instance of Stack shared across Express requests
const menuUndoStack = new Stack();

module.exports = menuUndoStack;
