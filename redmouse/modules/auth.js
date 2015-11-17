'use strict';

var u = require('util');
var async = require('async');
var crypto = require('crypto');
var friendlyUrl = require('friendly-url');


var _GET_BY_PROFILE_ID = 'SELECT * FROM root r WHERE r.%s.providerId = @providerid';

function makeSalt() {
    return crypto.randomBytes(16).toString('base64');
};

function makeResetLink() {
    return crypto.randomBytes(20).toString('base64');
};

function encryptPassword(password, salt) {
    if (!password || !salt) return '';
    var salt = new Buffer(salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};



module.exports = auth;


function auth(db, smtp){
    this.db = db;
    this.smtp = smtp;
}

auth.prototype.login = function (currentuser, profile, callback){
    
    if (currentuser) { // if already logged in
        if (account[profile.provider]) { // If the account already has the type of profile logging in with
           return callback(new Error('account already has a profile of this type'), account);
        }
    }
}


auth.prototype.getAccountBySlug = function(slug, callback) {
    this.db.getItem(slug, function (err, result) {
        if (err) return callback(err);
        return callback(null, account);        
    });
}

auth.prototype.getAccountByProvider = function (profile, callback) {    
    var querydef = {
        'query': u.format(GET_BY_PROFILE_ID, profile.provider),
        'parameters': [{ 'name': '@providerid', 'value': profile.providerId }]
    };

    this.db.queryCollection(queryDef, function (err, account) {
        if (err) return callback(err);
        return callback(null, account);
    });
}