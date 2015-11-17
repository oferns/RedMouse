var assert = require('assert');

var docdb = require('../../modules/docdb');


describe('docdb', function () {
    
    
    
    
    it('addItem calls createDocument on the client', function () {        
        var clientStub = {
            createDocument: function (link, item, callback) { callback(null, { 'id': '4321' }); }
        };
        
        var db = new docdb(clientStub, 'link');

        db.addItem({ 'id': '1234' }, function (err, result) { 
            assert.equal(err, null, 'err is not null');
            assert.equal(result.id, '4321', 'createDocument was not called');
        });    
    })

    it('addItem passes error to caller', function () {
        var clientStub = {
            createDocument: function (link, item, callback) { callback(new Error('This is an error')) }
        };
        
        var db = new docdb(clientStub, 'link');
        
        db.addItem({ 'id': '1234' }, function (err, result) {
            assert(err instanceof Error, 'err is not an error');
            assert(err.message == 'This is an error', ' err message is wrong')
            assert.strictEqual(result, undefined, 'Not expecting a return value');
        });
    })


});