'use strict';

var _GET_BY_ID = 'SELECT * FROM root r WHERE r.id = @key';

module.exports = docdb;

function docdb(client, collink) {
    var self = this;
    self.client = client;
    self.collink = collink;
    return;
}


docdb.prototype.createDatabase = function(db, callback) {
    var self = this;


    self.client.createDatabase({ id: db }, function () { 
    
    });
};


docdb.prototype.getItem = function (key, callback) {
    var self = this;
    var querydef = {
        'query': _GET_BY_ID,
        'parameters': [{ 'name': 'key', 'value': key }]
    };

    self.client.queryDocuments(self.collink, querydef).toArray(function (err, results) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, results);
        }
    });
}

docdb.prototype.addItem = function (item, callback) {
    var self = this;
    self.client.createDocument(self.collink, item, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

docdb.prototype.deleteItem = function (item, callback) {
    var self = this;
    self.client.deleteDocument(item._self, account, function (err, replaced) {
        if (err) {
            callback(err);
        } else {
            callback(null, replaced);
        }
    });
}

docdb.prototype.updateItem = function (item, callback){
    var self = this;
    self.client.replaceDocument(item._self, account, function (err, replaced) {
        if (err) {
            callback(err);
        } else {
            callback(null, replaced);
        }
    });
}