'use strict';

var _GET_BY_ID = 'SELECT * FROM root r WHERE r.id = @key';

module.exports = docdb;

function docdb(client, collink) {
    this.client = client;
    this.collink = collink;
}


docdb.prototype.createDatabase = function (db, callback) {        
    this.client.createDatabase({ id: db }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);    
    });
};

docdb.prototype.createCollection = function (dblink, collection, callback) {
    this.client.createCollection(dblink, { id: collection }, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
};


docdb.prototype.queryCollection = function (query, callback) {
    this.client.queryDocuments(this.collink, query).toArray(function (err, results) {
        if (err) return callback(err);
        return callback(null, results);
    });
};

docdb.prototype.getItem = function (key, callback) {
    var querydef = {
        'query': _GET_BY_ID,
        'parameters': [{ 'name': 'key', 'value': key }]
    };
    
    this.client.queryDocuments(this.collink, querydef).toArray(function (err, results) {
        if (err) return callback(err);        
        return callback(null, results[0]);
    });
};

docdb.prototype.addItem = function (item, callback) {
    this.client.createDocument(this.collink, item, function (err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
};

docdb.prototype.deleteItem = function (itemlink, callback) {
    this.client.deleteDocument(itemlink, account, function (err, deleted) {
        if (err) return callback(err);
        return callback(null, deleted);
    });
};

docdb.prototype.updateItem = function (item, callback) {
    this.client.replaceDocument(item._self, account, function (err, replaced) {
        if (err) return callback(err);
        return callback(null, replaced);
    });
};