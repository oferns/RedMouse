'use strict';

var _GET_BY_ID = 'SELECT * FROM root r WHERE r.id = @key';

module.exports = function docdb(client, collink) {
    
    var createDatabase = function (db, callback) {
        var querySpec = {
            query: _GET_BY_ID,
            parameters: [{
                    name: '@key',
                    value: db
                }]
        };
        
        client.queryDatabases(querySpec).toArray(function (err, results) {
            if (err) return callback(err);
            if (results.length > 0 ) return callback(null, results);
            
            client.createDatabase({ id: db }, function (err, result) {
                if (err) return callback(err);
                return callback(null, result);
            });
        });
    };
    
    var createCollection = function (dblink, collection, callback) {
        var querySpec = {
            query: _GET_BY_ID,
            parameters: [{
                    name: '@key',
                    value: collection
                }]
        };

        client.queryCollections(dblink, querySpec).toArray(function (err, results) {
            if (err) return callback(err);
            if (results.length > 0) return callback(null, results);            
            
            client.createCollection(dblink, { id: collection }, function (err, result) {
                if (err) return callback(err);
                return callback(null, result);
            });
        });
    };
    
    
    var queryCollection = function (query, callback) {
        client.queryDocuments(collink, query).toArray(function (err, results) {
            if (err) return callback(err);
            return callback(null, results);
        });
    };
    
    var getItem = function (key, callback) {
        var querydef = {
            'query': _GET_BY_ID,
            'parameters': [{ 'name': 'key', 'value': key }]
        };
        
        client.queryDocuments(collink, querydef).toArray(function (err, results) {
            if (err) return callback(err);
            if (results.length > 1) {
                return callback(new Error('More than one result returned'), results);
            } else if(results.length == 1){
                return callback(null, results[0]);
            } else {
                return callback(null, null);
            }            
        });
    };
    
    var addItem = function (item, callback) {
        client.createDocument(this.collink, item, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
        });
    };
    
    var deleteItem = function (itemlink, callback) {
        client.deleteDocument(itemlink, function (err, deleted) {
            if (err) return callback(err);
            return callback(null, deleted);
        });
    };
    
    var updateItem = function (item, callback) {
        client.replaceDocument(item._self, item, function (err, replaced) {
            if (err) return callback(err);
            return callback(null, replaced);
        });
    };
    return {
        createDatabase: createDatabase,
        createCollection: createCollection,
        queryCollection: queryCollection,
        getItem: getItem,
        addItem: addItem,
        deleteItem: deleteItem,
        updateItem: updateItem
    }
}