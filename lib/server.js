if (typeof ot === 'undefined') {
  var ot = {};
}

ot.Server = (function (global) {

  var MemoryStore = require('./inmemory-store');
  var Lock = require('lock');

  // Constructor. Takes the current document as a string and optionally the array
  // of all operations.
  function Server (store) {
    this.store = store || new MemoryStore();
    this.receiveOperationLock = Lock();
  }

  function receiveOperation(revision, operation, callback) {
    var self = this;

    self.store.getDocument(function (err, document, operationsCount) {
      if(err) return callback(err);

      if (revision < 0 || operationsCount < revision) {
        return callback(new Error("operation revision not in history"));
      }

      self.store.getOperations({since: revision}, function (err, concurrentOperations) {
        if(err) return callback(err);

        // ... and transform the operation against all these operations ...
        var transform = operation.constructor.transform;
        for (var i = 0; i < concurrentOperations.length; i++) {
          operation = transform(operation, concurrentOperations[i])[0];
        }

        self.store.insertOperation(operation, function (err) {
          if(err) return callback(err);
          
          callback(null, operation);
        });

      });

    });
  }

  // Call this method whenever you receive an operation from a client.
  Server.prototype.receiveOperation = function (revision, operation, callback) {
    var self = this;
    // since store could be fully async 
    // we will serialize all operations at this point.
    this.receiveOperationLock('receiveOperation', function (release) {
      receiveOperation.bind(self)(revision, operation, release(callback));
    });
  };

  return Server;

}(this));

if (typeof module === 'object') {
  module.exports = ot.Server;
}