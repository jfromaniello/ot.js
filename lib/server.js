if (typeof ot === 'undefined') {
  var ot = {};
}

function Lock () {
  this.pendingOperations = [];

  this._release = function() {
    //remove finished operation
    this.pendingOperations.splice(0, 1);

    //run pending 
    if(this.pendingOperations.length > 0){
      this.pendingOperations[0](this._release.bind(this));
    }
  };

  this.queue = function (f) {
    this.pendingOperations.push(f);

    //if the queue was empty, run this task
    if(this.pendingOperations.length === 1) {
      console.log('executing inmediately');
      f(this._release.bind(this));
    }else{
      console.log('queueing');
    }
  };
}

ot.Server = (function (global) {

  var MemoryStore = require('./inmemory-store');

  // Constructor. Takes the current document as a string and optionally the array
  // of all operations.
  function Server (store) {
    this.store = store || new MemoryStore();
    this.receiveOperationLock = new Lock();
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

        try{
          // ... and transform the operation against all these operations ...
          var transform = operation.constructor.transform;
          for (var i = 0; i < concurrentOperations.length; i++) {
            operation = transform(operation, concurrentOperations[i])[0];
          }
        } catch(er) {
          console.log('error transforming prime operation', er);
          return callback(er);          
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
    this.receiveOperationLock.queue(function (release) {
      receiveOperation.bind(self)(revision, operation, function () {
        callback.apply(self, arguments);
        release();
      });
    });
  };

  return Server;

}(this));

if (typeof module === 'object') {
  module.exports = ot.Server;
}