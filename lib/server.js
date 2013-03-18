if (typeof ot === 'undefined') {
  var ot = {};
}

ot.Server = (function (global) {

  var MemoryStore = require('./inmemory-store');

  // Constructor. Takes the current document as a string and optionally the array
  // of all operations.
  function Server (store) {
    this.store = store || new MemoryStore();
  }

  // Call this method whenever you receive an operation from a client.
  Server.prototype.receiveOperation = function (revision, originalOperation, callback) {
    var self = this;
    var operation = originalOperation.clone();

    self.store.getDocument({ since: revision }, function (err, document) {
      if(err) return callback(err);

      if (revision < 0 || document.operationsCount < revision) {
        return callback(new Error("operation revision not in history"));
      }

      try{
        // ... and transform the operation against all these operations ...
        var transform = operation.constructor.transform;
        for (var i = 0; i < document.operations.length; i++) {
          operation = transform(operation, document.operations[i])[0];
        }
      } catch(er) {
        console.log('error transforming prime operation', er);
        return callback(er);          
      }

      self.store.insertOperation(operation, document.lastUpdate, document.content, function (err, result) {
        if(err) return callback(err);
        if(!result){
          //this means that the operation insert failed 
          //because of concurrency problem. 
          //Rexecute this method as a whole.
          return callback(new Error('expected concurrency error, client will retry automatically'));
        }
        callback(null, operation);
      });
    });
  };

  return Server;

}(this));

if (typeof module === 'object') {
  module.exports = ot.Server;
}