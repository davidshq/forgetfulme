// Minimal mock implementation
const mockElement = {
  children: [],
  appendChild: function (child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  },
  removeChild: function (child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  },
  querySelectorAll: function (selector) {
    const results = [];
    const searchElement = element => {
      if (
        selector === '.message' &&
        element.className &&
        element.className.includes('message')
      ) {
        results.push(element);
      }
      element.children.forEach(child => searchElement(child));
    };
    searchElement(this);
    return results;
  },
};

// Test
const container = Object.create(mockElement);
container.children = [];

// Add messages
const msg1 = { className: 'message', parentNode: null, children: [] };
const msg2 = { className: 'message', parentNode: null, children: [] };
const msg3 = { className: 'message', parentNode: null, children: [] };

container.appendChild(msg1);
container.appendChild(msg2);
container.appendChild(msg3);

console.log('Before clear:', container.querySelectorAll('.message').length);

// Clear messages
const messages = container.querySelectorAll('.message');
messages.forEach(message => {
  if (message.parentNode) {
    message.parentNode.removeChild(message);
  }
});

console.log('After clear:', container.querySelectorAll('.message').length);
console.log('Container children:', container.children.length);
