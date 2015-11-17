var assert = require('assert');
var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);

var should = chai.should();
var expect = chai.expect;


describe('auth', function () {
    
    // If we are going to test it then we need it
    var auth = require('../../modules/auth');
    
    var localAccount = {
        'Local': {
            'providerId': 'test@test.com',
            'salt': 'salt',
            'password': 'KL5SstCEoc3YHdhTme0O9oG0c4E7sJ5m12KmlTkBbx74knEVOY/Og3OSyzpCX4DMMw61U7KieV8XBlEuUQYhJQ==', // password
            'provider': 'Local'
        }
    };
    
    describe('#login', function () {
        it('should return error on undefined/null profile', function () {
            var authobj = new auth({}, {});
            
            authobj.login(null, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'Only local profiles can login!', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('should return error on non-local profile', function () {
            var authobj = new auth({}, {});
            
            authobj.login({}, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'Only local profiles can login!', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        
        })
        
        it('should return error when getAccountByProvider errors', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(new Error('This is an error')); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.login(localAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;

        })
        
        it('should return error with wrong password', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, localAccount); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var profile = { 'provider': 'Local','password': 'thisiswrong' };
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(authobj, 'encryptPassword');            
            var spy3 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.login(profile, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'Login failed! Invalid credentials', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        })

        it('should return the account when password is good', function () { 
        
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, localAccount); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var profile = { 'providerId': 'test@test.com','provider': 'Local', 'password': 'password' };
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(authobj, 'encryptPassword');
            var spy3 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.login(profile, function (err, account) {
                assert.equal(err, undefined, 'err is not null');
                assert.equal(profile.providerId, account.Local.providerId, 'wrong document returned');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        })
    })
})
