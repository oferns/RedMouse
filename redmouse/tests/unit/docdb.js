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
    describe('createDatabase', function () {
        it('should call createDatabase on the client', function () {
            var clientMock = {
                createDatabase: function (db, callback) { callback(null, db); }
            };
            
            var spy = chai.spy.on(clientMock, 'createDatabase')
            
            var db = new docdb(clientMock, 'link');
            
            db.createDatabase('test', function (err, result) {
                assert.equal(err, undefined, 'err is not null');
                assert.deepEqual({'id': 'test'}, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    // The addItem method tests
    describe('addItem', function () {        
        it('should call createDocument on the client', function () {
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
        
        it('should pass error to caller', function () {
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

    describe('createCollection', function () { 
    
    })

    describe('queryCollection', function () { 
    
    })

    describe('getItem', function () { 
    
    })
    
    describe('deleteItem', function () { 
    
    })

    describe('updateItem', function () { 
    
    })

});