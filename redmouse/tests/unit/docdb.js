var assert = require('assert');
var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);

var should = chai.should();
var expect = chai.expect;

describe('docdb', function () {
    
    // If we are going to test it then we need it
    var docdb = require('../../modules/docdb');
    
    // A dummy document used in the tests
    var doc = { 'id': '1234' };
    
    // The createDatabase method tests
    describe('#createDatabase()', function () {
        it('createDatabase should return an error when db errors', function () {
            var clientMock = {
                createDatabase: function (db, callback) { callback(new Error('This is an error')); }
            };
            
            var spy = chai.spy.on(clientMock, 'createDatabase')
            
            var db = new docdb(clientMock, 'link');
            
            db.createDatabase('test', function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        
        })
        
        it('createDatabase should call createDatabase on the client', function () {
            var clientMock = {
                createDatabase: function (db, callback) { callback(null, db); }
            };
            
            var spy = chai.spy.on(clientMock, 'createDatabase')
            
            var db = new docdb(clientMock, 'link');
            
            db.createDatabase('test', function (err, result) {
                assert.equal(err, undefined, 'err is not null');
                assert.deepEqual({ 'id': 'test' }, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    describe('#createCollection()', function () {
        it('createCollection should return an error when db errors', function () {
            var clientMock = {
                createCollection: function (link, collection, callback) { callback(new Error('This is an error')); }
            };
            
            var spy = chai.spy.on(clientMock, 'createCollection')
            
            var db = new docdb(clientMock, 'link');
            
            db.createCollection('link', 'test', function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('createCollection should return collection', function () {
            
            var clientMock = {
                createCollection: function (link, collection, callback) { callback(null, { 'id': 'coll' }); }
            };
            
            var spy = chai.spy.on(clientMock, 'createCollection')
            
            var db = new docdb(clientMock, 'link');
            
            db.createCollection('link', 'test', function (err, result) {
                assert.equal(err, undefined, 'err is not null');
                assert.deepEqual({ 'id': 'coll' }, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    
    // The addItem method tests
    describe('addItem', function () {
        it('addItem should call createDocument on the client', function () {
            var clientMock = {
                createDocument: function (link, item, callback) { callback(null, item); }
            };
            
            var spy = chai.spy.on(clientMock, 'createDocument')
            
            var db = new docdb(clientMock, 'link');
            
            db.addItem(doc, function (err, result) {
                assert.equal(err, null, 'err is not null');
                assert.deepEqual(doc, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('addItem should return an error when db errors', function () {
            var clientMock = {
                createDocument: function (link, item, callback) { callback(new Error('This is an error')) }
            };
            
            var spy = chai.spy.on(clientMock, 'createDocument')
            
            var db = new docdb(clientMock, 'link');
            
            db.addItem(doc, function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    
    describe('queryCollection', function () { 
    
    })
    
    describe('getItem', function () { 
    
    })
    
    describe('deleteItem', function () {
        it('deleteItem should call deleteDocument on the client', function () {
            var clientMock = {
                deleteDocument: function (link, callback) { callback(null, link); }
            };
            
            var spy = chai.spy.on(clientMock, 'deleteDocument')
            
            var db = new docdb(clientMock, 'link');
            
            db.deleteItem('link', function (err, result) {
                assert.equal(err, null, 'err is not null');
                assert.deepEqual('link', result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('deleteDocument should return an error when db errors', function () {
            var clientMock = {
                deleteDocument: function (link, callback) { callback(new Error('This is an error')); }
            };
            
            var spy = chai.spy.on(clientMock, 'deleteDocument')
            
            var db = new docdb(clientMock, 'link');
            
            db.deleteItem('link', function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    describe('updateItem', function () {
        it('updateItem should call replaceDocument on the client', function () {
            var clientMock = {
                replaceDocument: function (link, item, callback) { callback(null, item); }
            };
            
            var spy = chai.spy.on(clientMock, 'replaceDocument');
            
            var db = new docdb(clientMock, 'link');
            
            var doc = { '_self': 'link' };

            db.updateItem(doc, function (err, result) {
                assert.equal(err, null, 'err is not null');
                assert.deepEqual(doc, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
    
        it('updateItem should return an error when db errors', function () {
            var clientMock = {
                replaceDocument: function (link, item, callback) { callback(new Error('This is an error')); }
            };
            
            var spy = chai.spy.on(clientMock, 'replaceDocument');
            
            var db = new docdb(clientMock, 'link');
            
            db.updateItem('link', function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })

    })

});