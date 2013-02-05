if (typeof ot === 'undefined') {
  var ot = {};
}

ot.MemoryStore = (function (global) {

  // Constructor. Takes the current document as a string and optionally the array
  // of all operations.
  function MemoryStore (document, operations) {
    this.document = document || '';
    this.operations = operations || [];
  }

  MemoryStore.prototype.getOperations = function (options, callback) {
    if(typeof options == 'function') {
      callback = options;
      options = {};
    }
    
    if(options.since){
      callback(null, this.operations.slice(options.since));
    }else {
      callback(null, this.operations);
    }
  };

  MemoryStore.prototype.getDocument = function (callback) {
    callback(null, this.document, this.operations.length);
  };

  MemoryStore.prototype.insertOperation = function (operation, callback) {
    this.document = operation.apply(this.document);
    this.operations.push(operation);
    callback();
  };

  return MemoryStore;

}(this));

if (typeof module === 'object') {
  module.exports = ot.MemoryStore;
}