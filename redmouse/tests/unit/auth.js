var assert = require('assert');
var chai = require('chai');
var spies = require('chai-spies');

chai.use(spies);

var should = chai.should();
var expect = chai.expect;


describe('auth', function () {
    
    // If we are going to test it then we need it
    var auth = require('../../modules/auth');
    
    var testAccount = {
        'Local': {
            'name': 'test',
            'providerId': 'test@test.com',
            'salt': 'salt',
            'password': 'KL5SstCEoc3YHdhTme0O9oG0c4E7sJ5m12KmlTkBbx74knEVOY/Og3OSyzpCX4DMMw61U7KieV8XBlEuUQYhJQ==', // password
            'provider': 'Local'
        },
        'Social': {
            'name': 'test',
            'providerId': 'socialid',
            'provider': 'Social'
        },
        'id': 'slug'
    };
    
    describe('#login()', function () {
        it('login should return error on undefined/null profile', function () {
            var authobj = new auth({}, {});
            
            authobj.login(null, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'Only local profiles can login!', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('login should return error on non-local profile', function () {
            var authobj = new auth({}, {});
            
            authobj.login({}, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'Only local profiles can login!', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        
        })
        
        it('login should return error when getAccountByProvider errors', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(new Error('This is an error')); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.login(testAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;

        })
        
        it('login should return error with wrong password', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, testAccount); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var profile = { 'providerId': 'test@test.com', 'provider': 'Local', 'password': 'thisiswrong' };
            
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
        
        it('login should return the account when password is good', function () {
            
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, testAccount); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var profile = { 'providerId': 'test@test.com', 'provider': 'Local', 'password': 'password' };
            
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
    
    describe('#register()', function () {
        it('register should return an error when the db fails on looking for existing account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(new Error('This is an error')); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.register(testAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        
        })
        
        it('register should return an error when the db fails on adding a new account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, null); },
                addItem: function (item, callback) { return callback(new Error('This is an error')) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            var spy3 = chai.spy.on(docDbMock, 'addItem');
            
            authobj.register(testAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        
        })
        
        it('register should return an error when the profile exists', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, testAccount); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.register(testAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This profile is already registered', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        
        })
        
        it('register should set id and displayName on profile and return new account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, null); },
                addItem: function (item, callback) { return callback(null, item) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            var spy3 = chai.spy.on(docDbMock, 'addItem');
            
            authobj.register(testAccount.Local, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert(account.id == 'test', 'didnt set Id');
                assert(account.displayName == 'test', 'didnt set display name');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        
        })
        
        it('register should set salt and encrypt password on local profile and return new account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, null); },
                addItem: function (item, callback) { return callback(null, item) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            var spy3 = chai.spy.on(docDbMock, 'addItem');
            
            var profile = {
                'name': 'test',
                'providerId': 'test@test.com',
                'salt': 'salt',
                'password': 'password',
                'provider': 'Local'
            };
            
            authobj.register(profile, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert(account.Local.salt != testAccount.Local.salt, 'didnt set Id');
                assert(account.Local.password != testAccount.Local.password, 'didnt set display name');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        })
    })
    
    describe('#socialLogin()', function () {
        it('socialLogin should return an error when the db fails on looking for existing account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(new Error('This is an error')); }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.socialLogin(testAccount.Social, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('socialLogin should return an error when the db fails on registering a new account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, null); },
                addItem: function (item, callback) { return callback(new Error('This is an error')) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            var spy3 = chai.spy.on(docDbMock, 'addItem');
            
            authobj.socialLogin(testAccount.Social, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        })
        
        it('socialLogin should return an existing account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, testAccount); },
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            authobj.socialLogin(testAccount.Social, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.deepEqual(testAccount, account, 'didnt set Id');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        
        })
        
        it('socialLogin should return an new account', function () {
            var docDbMock = {
                queryCollection: function (queryDef, callback) { return callback(null, null); },
                addItem: function (item, callback) { return callback(null, testAccount) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            var spy3 = chai.spy.on(docDbMock, 'addItem');
            
            authobj.socialLogin(testAccount.Social, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.deepEqual(testAccount, account, 'didnt set Id');
            })
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
            expect(spy3).to.have.been.called.once;
        
        })
    
    })
    
    describe('#addProfile()', function () {
        it('addProfile should return error when db errors', function () {
            var docDbMock = {
                updateItem: function (item, callback) { return callback(new Error('This is an error')) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            authobj.addProfile(testAccount, { provider: 'Test' }, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message == 'This is an error', 'err message is wrong')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            })
        })
        
        it('addProfile should add profile to existing account', function () {
            var docDbMock = {
                updateItem: function (item, callback) { return callback(null, item) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            authobj.addProfile(testAccount, { provider: 'Test' }, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.deepEqual(testAccount, account, 'didnt set Id');
            })
        })
    })
    
    describe('#getAccountByProvider()', function () {
        
        it('getAccountByProvider should return error on undefined/null profile', function () {
            var authobj = new auth({}, {});
            authobj.getAccountByProvider(null, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'You must provide a profile with a provider, and a providerid property')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('getAccountByProvider should return error on undefined/null profile.provider', function () {
            var authobj = new auth({}, {});
            var profile = { 'providerId': 'someid' };
            
            authobj.getAccountByProvider(profile, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'You must provide a profile with a provider, and a providerid property')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('getAccountByProvider should return error on undefined/null profile.providerId', function () {
            var authobj = new auth({}, {});
            var profile = { 'provider': {} };
            
            authobj.getAccountByProvider(profile, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'You must provide a profile with a provider, and a providerid property')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('getAccountByProvider should return error on when db.queryCollection returns an error', function () {
            
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(new Error('This is an error')) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            authobj.getAccountByProvider(testAccount.Local, function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'This is an error')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
        })
        
        it('getAccountByProvider should return account when passed a valid profile', function () {
            
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, testAccount) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            
            authobj.getAccountByProvider(testAccount.Local, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.strictEqual(testAccount, account, 'Wrong account return');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
        
        it('getAccountByProvider should return null when passed an invalid profile', function () {
            
            var docDbMock = {
                queryCollection: function (queryDef, callback) { callback(null, null) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(authobj, 'getAccountByProvider');
            var spy2 = chai.spy.on(docDbMock, 'queryCollection');
            
            
            authobj.getAccountByProvider(testAccount.Local, function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.strictEqual(null, account, 'Wrong account return');
            });
            
            expect(spy).to.have.been.called.once;
            expect(spy2).to.have.been.called.once;
        })
    })
    
    describe('#getAccountBySlug()', function () {
        it('getAccountBySlug should return an error when db returns an error', function () {
            var docDbMock = {
                getItem: function (item, callback) { callback(new Error('This is an error')) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(docDbMock, 'getItem');
            
            authobj.getAccountBySlug('slug', function (err, account) {
                assert(err instanceof Error, 'err is not an error');
                assert(err.message === 'This is an error')
                assert.strictEqual(account, undefined, 'Not expecting a return value');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('getAccountBySlug should return null when account not found', function () {
            var docDbMock = {
                getItem: function (item, callback) { callback(null, null) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(docDbMock, 'getItem');
            
            authobj.getAccountBySlug('slug', function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.strictEqual(null, account, 'Wrong account return');
            });
            
            expect(spy).to.have.been.called.once;
        })
        
        it('getAccountBySlug should return the account when found', function () {
            var docDbMock = {
                getItem: function (item, callback) { callback(null, testAccount) }
            };
            
            var authobj = new auth(docDbMock, {});
            
            var spy = chai.spy.on(docDbMock, 'getItem');
            
            authobj.getAccountBySlug('slug', function (err, account) {
                assert.equal(err, null, 'err is not an error');
                assert.strictEqual(testAccount, account, 'Wrong account return');
            });
            
            expect(spy).to.have.been.called.once;
        })

    })
    
    describe('#makeSalt()', function () {
        it('makeSalt should return different strings', function () {
            var authobj = new auth(null, null);
            
            var salt1 = authobj.makeSalt();
            var salt2 = authobj.makeSalt();
            
            assert(salt1 != salt2, 'makeSalt should make a different salt')
        })
    })
    
    describe('#makeResetLink()', function () {
        it('makeResetLink should return different strings', function () {
            var authobj = new auth(null, null);
            
            var salt1 = authobj.makeResetLink();
            var salt2 = authobj.makeResetLink();
            
            assert(salt1 != salt2, 'makeResetLink should make a different salt')
        })
    })
    
    describe('#encryptPassword()', function () {
        it('encryptPassword should return different strings', function () {
            var authobj = new auth(null, null);
            
            var salt1 = authobj.makeResetLink();
            var salt2 = authobj.makeResetLink();
            
            assert(salt1 != salt2, 'makeResetLink should make a different salt')
        })
    })
})
