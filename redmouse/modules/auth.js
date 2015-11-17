'use strict';

var u = require('util');
var async = require('async');
var crypto = require('crypto');
var friendlyUrl = require('friendly-url');

var _GET_BY_PROFILE_ID = 'SELECT * FROM root r WHERE r.%s.providerId = @providerid';

module.exports = auth;

function auth(db, smtp){
    this.db = db;
    this.smtp = smtp;
}

auth.prototype.login = function (profile, callback){
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
    })
}


auth.prototype.socialLogin = function (profile, callback){

}


auth.prototype.addProfile = function (currentuser, profile, callback){

}

auth.prototype.getAccountBySlug = function(slug, callback) {
    this.db.getItem(slug, function (err, result) {
        if (err) return callback(err);
        return callback(null, account);        
    });
}

auth.prototype.getAccountByProvider = function (profile, callback) {    
    var queryDef = {
        'query': u.format(_GET_BY_PROFILE_ID, profile.provider),
        'parameters': [{ 'name': '@providerid', 'value': profile.providerId }]
    };

    this.db.queryCollection(queryDef, function (err, account) {
        if (err) return callback(err);
        return callback(null, account);
    });
}

auth.prototype.makeSalt = function () {
    return crypto.randomBytes(16).toString('base64');
}

auth.prototype.makeResetLink = function () {
    return crypto.randomBytes(20).toString('base64');
}

auth.prototype.encryptPassword = function (password, salt) {
    if (!password || !salt) return '';
    var salt = new Buffer(salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
}

