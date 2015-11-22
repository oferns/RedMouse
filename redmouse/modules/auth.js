'use strict';

var u = require('util');
var async = require('async');
var crypto = require('crypto');
var friendlyUrl = require('friendly-url');

var _GET_BY_PROFILE_ID = 'SELECT * FROM root r WHERE r.%s.providerId = @providerid';

module.exports = function (db, smtp) {
    
    var login = function (profile, callback) {
        if (!profile || profile.provider !== 'Local') {
            return callback(new Error('Only local profiles can login!'));
        }
        
        var self = this;
        
        self.getAccountByProvider(profile, function (err, account) {
            if (err) return callback(err);
            
            if (self.encryptPassword(profile.password, account.Local.salt) != account.Local.password) { // Password was wrong
                return callback(new Error('Login failed! Invalid credentials'));
            }
            
            return callback(null, account);
        });
    }
    
    var register = function (profile, callback) {
        var self = this;
        
        self.getAccountByProvider(profile, function (err, account) {
            if (err) return callback(err);
            if (account) return callback(new Error('This profile is already registered'));
            
            account = {
                'id': friendlyUrl(profile.name),
                'displayName': profile.name
            };
            
            account[profile.provider] = profile; // Add/replace the account profile we are logging in with                                
            
            if (account.Local) {
                account.Local.salt = self.makeSalt();
                account.Local.password = self.encryptPassword(account.Local.password, account.Local.salt);
            }
            
            db.addItem(account, function (err, newaccount) {
                if (err) return callback(err);
                return callback(null, newaccount);
            });
        });
    }
    
    var socialLogin = function (profile, callback) {
        var self = this;
        
        self.getAccountByProvider(profile, function (err, account) {
            if (err) return callback(err);
            
            if (!account) {
                db.addItem(profile, function (err, newaccount) {
                    if (err) return callback(err);
                    return callback(null, newaccount);
                });
            } else {
                return callback(null, account);
            }
        });
    }
    
    
    var addProfile = function (currentaccount, profile, callback) {
        currentaccount[profile.provider] = profile;
        db.updateItem(currentaccount, function (err, account) {
            if (err) return callback(err);
            return callback(null, account);
        });
    }
    
    var getAccountBySlug = function (slug, callback) {
        db.getItem(slug, function (err, result) {
            if (err) return callback(err);
            return callback(null, result);
        });
    }
    
    var getAccountByProvider = function (profile, callback) {
        if (!profile || !profile.provider || !profile.providerId) {
            return callback(new Error('You must provide a profile with a provider, and a providerid property'));
        }
        
        var queryDef = {
            'query': u.format(_GET_BY_PROFILE_ID, profile.provider),
            'parameters': [{ 'name': '@providerid', 'value': profile.providerId }]
        };
        
        db.queryCollection(queryDef, function (err, account) {
            if (err) return callback(err);
            return callback(null, account);
        });
    }
    
    var makeSalt = function () {
        return crypto.randomBytes(16).toString('base64');
    }
    
    var makeResetLink = function () {
        return crypto.randomBytes(20).toString('base64');
    }
    
    var encryptPassword = function (password, salt) {
        var salt = new Buffer(salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    }
    
    return {
        login: login,
        register: register,
        addProfile: addProfile,
        socialLogin: socialLogin,
        getAccountByProvider: getAccountByProvider,
        getAccountBySlug: getAccountBySlug,
        makeSalt: makeSalt,
        encryptPassword: encryptPassword,
        makeResetLink: makeResetLink
    }
}