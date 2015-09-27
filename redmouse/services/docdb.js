'use strict';

var util = require('util');
var async = require('async');
var Documentclient = require('documentdb').DocumentClient;

function DocDB(options) {
    var self = this;
    
    self.client = new Documentclient(options.uri, { masterKey: options.primaryKey });
    self.databaseId = options.database || 'docdbbp';
    self.collectionId = options.collection || 'default';
    self.isReady = false;
    
    self.readOrCreateDatabase(self.databaseId, function (e, db) {
       // debugger;
        if (e) {
            console.log(e);
            throw e;
        }
        
        self.db = db;
        

        self.readOrCreateCollection(self.db._self, self.collectionId, function (e, collection) {
            if (!e) {
                self.collection = collection;
                self.isReady = true;
            } else {
                throw e;
            }
        });
    });
};

DocDB.prototype.updateItem = function (item, callback) {
    var self = this;
    
    self.client.replaceDocument(item._self, item, function (err, doc) {
        return callback(err, doc);
    });
};

/* get item
* query: the select condition
* example: "select * where userId = 1"
*/ 
DocDB.prototype.getItem = function (query, callback) {
    var self = this;
    
    self.client.queryDocuments(self.collection._self, query).toArray(function (err, results) {
        if (err || results.length == 0) {
            return callback(err);
        }
        
        return callback(null, results[0]);
    });
};

// create an item
DocDB.prototype.addItem = function (item, callback) {
    var self = this;
    
    self.client.createDocument(self.collection._self, item, function (err, doc) {
        return callback(err, doc);
    });
};


// query the provided table/collection
DocDB.prototype.queryItems = function (query, callback) {
    var self = this;
    
    self.client.queryDocuments(self.collection._self, query).toArray(function (err, docs) {
        return callback(err, docs);
    });
};

DocDB.prototype.removeItem = function (item, callback) {
    var self = this;
    
    self.client.deleteDocument(item, function (e) {
        return callback(e);
    });
};

// if the database does not exist, then create it, else return the database object
DocDB.prototype.readOrCreateDatabase = function (databaseId, callback) {
    var self = this;
    
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
                name: '@id',
                value: databaseId
            }]
    };
    
    self.client.queryDatabases(querySpec).toArray(function (err, results) {
        if (err) {
            callback(err);

        } else {
            if (results.length === 0) {
                var databaseSpec = {
                    id: databaseId
                };
                
                client.createDatabase(databaseSpec, function (err, created) {
                    callback(null, created);
                });

            } else {
                callback(null, results[0]);
            }
        }
    });

};

// if the collection does not exist for the database provided, create it, else return the collection object
DocDB.prototype.readOrCreateCollection = function (database, collectionId, callback) {
    var self = this;
    
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
                name: '@id',
                value: collectionId
            }]
    };
    
    self.client.queryCollections(database, querySpec).toArray(function (err, results) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            if (results.length === 0) {
                var collectionSpec = {
                    id: collectionId
                };
                
                var requestOptions = {
                    offerType: 'S1'
                };
                
                self.client.createCollection(database, collectionSpec, requestOptions, function (err, created) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    callback(null, created);
                });

            } else {
                self.client.deleteCollection(results[0]._self, requestOptions, function (err, deleted) {
                    if (err) {
                        console.log(err);
                        throw err;
                    }
                    self.client.createCollection(database, collectionSpec, requestOptions, function (err, created) {
                        if (err) {
                            console.log(err);
                            throw err;
                        }
                        callback(null, created);
                    });
                });

//                callback(null, results[0]);
            }
        }
    });

};


module.exports = DocDB;
