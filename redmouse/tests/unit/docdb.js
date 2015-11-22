var assert = require('assert');
var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);

var should = chai.should();
var expect = chai.expect;

describe('docdb', function () {
    
    // A dummy document used in the tests
    var doc = { 'id': '1234' };
    
    var testerr = new Error('This is an error');
    
    // The createDatabase method tests
    describe('#createDatabase()', function () {
        var testdb = 'test';
        var testdbObj = { 'id': 'test' };
        
        it('createDatabase should return an error when queryDatabase fails', function () {
            
            var clientMock = {
                queryDatabases: function (querySpec) { return { toArray: function (callback) { return callback(testerr) } } },
                createDatabase: function (db, callback) { throw testerr; } // This should not be called
            };
            
            var spy = chai.spy.on(clientMock, 'queryDatabases');
            var spy2 = chai.spy.on(clientMock, 'createDatabase');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createDatabase('test', function (err, result) {
                assert.strictEqual(testerr, err, 'Incorrect error');
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.not.have.been.called.once;
        
        })
        
        it('createDatabase should return an error when createDatabase fails', function () {
            var clientMock = {
                queryDatabases: function (querySpec) { return { toArray: function (callback) { return callback(null, []) } } },
                createDatabase: function (db, callback) { callback(testerr); }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDatabases');
            var spy2 = chai.spy.on(clientMock, 'createDatabase');
            
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createDatabase('test', function (err, result) {
                assert.strictEqual(testerr, err, 'Incorrect error');
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('createDatabase should call createDatabase on the client when db does not exist', function () {
            var clientMock = {
                queryDatabases: function (querySpec) { return { toArray: function (callback) { return callback(null, []) } } },
                createDatabase: function (db, callback) { return callback(null, [testdbObj]); }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDatabases');
            var spy2 = chai.spy.on(clientMock, 'createDatabase');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createDatabase(testdb, function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(testdbObj, result[0], 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('createDatabase should not call createDatabase when db already exists', function () {
            var clientMock = {
                queryDatabases: function (querySpec) { return { toArray: function (callback) { return callback(null, [testdbObj]) } } },
                createDatabase: function (db, callback) { callback(null, testdbObj); }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDatabases');
            var spy2 = chai.spy.on(clientMock, 'createDatabase');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createDatabase(testdb, function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(testdbObj, result[0], 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.not.have.been.called.once;
        
        })
    })
    
    describe('#createCollection()', function () {
        var testcol = 'test';
        var testcolObj = { 'id': 'test' };
        
        it('createCollection should return an error when queryCollections fails', function () {
            var clientMock = {
                queryCollections: function (querySpec) { return { toArray: function (callback) { return callback(testerr) } } },                
                createCollection: function (link, collection, callback) { throw testerr; } // This should not be called
            };
            
            var spy = chai.spy.on(clientMock, 'queryCollections');
            var spy2 = chai.spy.on(clientMock, 'createCollection');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createCollection('link', 'test', function (err, result) {
                assert.strictEqual(testerr, err, 'Incorrect error');
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.not.have.been.called.once;

        })
        
        it('createCollection should return an error when createCollection fails', function () {
            
            var clientMock = {
                queryCollections: function (querySpec) { return { toArray: function (callback) { return callback(null, []) } } },                
                createCollection: function (link, collection, callback) { callback(testerr); }
            };
            
            var spy = chai.spy.on(clientMock, 'queryCollections')
            var spy2 = chai.spy.on(clientMock, 'createCollection')
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createCollection('link', 'test', function (err, result) {
                assert.strictEqual(testerr, err, 'Incorrect error');
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('createCollection should call createCollection when the collection does not exist', function () {
            
            var clientMock = {
                queryCollections: function (querySpec) { return { toArray: function (callback) { return callback(null, []) } } },                
                createCollection: function (link, collection, callback) { callback(null, [testcolObj]); }
            };
            
            var spy = chai.spy.on(clientMock, 'queryCollections');
            var spy2 = chai.spy.on(clientMock, 'createCollection');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createCollection('link', testcol, function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(testcolObj, result[0], 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('createCollection should not call createCollection when collection already exists', function () {
            
            var clientMock = {
                queryCollections: function (querySpec) { return { toArray: function (callback) { return callback(null, [testcolObj]) } } },                
                createCollection: function (link, collection, callback) { throw testerr; }
            };
            
            var spy = chai.spy.on(clientMock, 'queryCollections')
            var spy2 = chai.spy.on(clientMock, 'createCollection')
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.createCollection('link', testcol, function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(testcolObj, result[0], 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.not.have.been.called.once;
        })
    })
    
    
    // The addItem method tests
    describe('addItem', function () {
        
        it('addItem should call createDocument on the client', function () {
            var clientMock = {
                createDocument: function (link, item, callback) { callback(null, item); }
            };
            
            var spy = chai.spy.on(clientMock, 'createDocument');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.addItem(doc, function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(doc, result, 'wrong document returned');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('addItem should return an error when db errors', function () {
            var clientMock = {
                createDocument: function (link, item, callback) { callback(testerr) }
            };
            
            var spy = chai.spy.on(clientMock, 'createDocument');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.addItem(doc, function (err, result) {
                assert.strictEqual(testerr, err, 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
    })
    
    
    describe('queryCollection', function () {
        
        it('queryCollection should return error if db errors', function () {
            var clientMock = {
                queryDocuments: function (link, query) { return { toArray: function (callback) { return callback(testerr) } } }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.queryCollection('This is a query', function (err, results) {
                assert.strictEqual(testerr, err, 'err message is wrong')
                assert.strictEqual(results, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            
        })
        
        it('queryCollection should return ermpty array if not found', function () {
            var clientMock = {
                queryDocuments: function (link, query) { return { toArray: function (callback) { return callback(null, []) } } }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.queryCollection('This is a query', function (err, results) {
                assert.strictEqual(err, null, 'err is not null');
                assert.equal(results.length, 0, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('queryCollection should return results if found', function () {
            var clientMock = {
                queryDocuments: function (link, query) { return { toArray: function (callback) { return callback(null, doc) } } }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.queryCollection('This is a query', function (err, results) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(results, doc, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })

    })
    
    describe('getItem', function () {
        
        it('getItem should return error if db errors', function () {
            var clientMock = {
                queryDocuments: function (link, query) { return { toArray: function (callback) { return callback(testerr) } } }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments')
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.getItem('key', function (err, results) {
                assert.strictEqual(testerr, err, 'err is not an error');
                assert.strictEqual(results, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
            
        })
        
        it('getItem should return null if not found', function () {
            var clientMock = {
                queryDocuments: function (link, query) { return { toArray: function (callback) { return callback(null, []) } } }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.getItem('key', function (err, results) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(results, null, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('getItem should return object if one result found', function () {
            
            var clientMock = {
                queryDocuments: function (link, query) {
                    return { toArray: function (callback) { return callback(null, [doc]); } }
                }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.getItem('key', function (err, result) {
                assert.strictEqual(err, null, 'err is not null');
                assert.strictEqual(result, doc, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('getItem should return error and results if more than one result found', function () {
            var clientMock = {
                queryDocuments: function (link, query) {
                    return { toArray: function (callback) { return callback(null, [doc, doc]); } }
                }
            };
            
            var spy = chai.spy.on(clientMock, 'queryDocuments');
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.getItem('key', function (err, results) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'More than one result returned');
                assert(results.length > 1, 'Not enough results returned');
            });
            
            expect(spy).to.have.been.called.once;                
        })        
    })
    
    describe('deleteItem', function () {
        
        it('deleteItem should call deleteDocument on the client', function () {
            var clientMock = {
                deleteDocument: function (link, callback) { callback(null, link); }
            };
            
            var spy = chai.spy.on(clientMock, 'deleteDocument')
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
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
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
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
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
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
            
            var db = require('../../modules/docdb')(clientMock, 'link');
            
            db.updateItem('link', function (err, result) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(result, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })

    })
});