if (typeof ot === 'undefined') {
  var ot = {};
}

ot.MemoryStore = (function (global) {

  // Constructor. Takes the current document as a string and optionally the array
  // of all operations.
  function MemoryStore (content, operations) {
    this.content = content || '';
    this.operations = operations || [];
    this.lastUpdate = new Date();
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

  MemoryStore.prototype.getDocument = function (options, callback) {
    this.getOperations(options, function (err, operations) {
      callback(null, {
        content:         this.content, 
        operationsCount: this.operations.length,
        operations:      operations,
        lastUpdate:      this.lastUpdate
      });
    });
  };

  MemoryStore.prototype.insertOperation = function (operation, callback) {
    this.lastUpdate = new Date();
    this.content = operation.apply(this.content);
    this.operations.push(operation);
    callback(null, true);
  };

  return MemoryStore;

}(this));

if (typeof module === 'object') {
  module.exports = ot.MemoryStore;
}