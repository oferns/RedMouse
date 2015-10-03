'use strict';

var GET_BY_ID = 'SELECT * FROM root r WHERE r.id = "%s"';
var GET_BY_PROFILE_ID = 'SELECT * FROM root r WHERE r.%s.providerId = "%s"';

var u = require('util')
var async = require('async');
var crypto = require('crypto');

var DocDB = require('./docdb.js');


function Auth(options) {
    var self = this;
    self.docDB = new DocDB(options.docDb);
    self.providers = options.authproviders;
    // Atomic Merge accounts
    // 
    self.docDB.createStoredProcedureAsync(collection._self, {
        name: "mergeAccounts",
        body: function (masterAccountId, childAccountId) { // profileId = The Master profile receiving the childId profile
            
            var context = getContext();
            var collection = context.getCollection();
            var response = context.getResponse();
            
            
            var masterAccount = collection.queryDocuments()

        }
   
    
    }).then(function (response) {
        self.= response.resource;
    });


}

Auth.prototype.makeSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

Auth.prototype.encryptPassword = function (password, salt) {
    if (!password || !salt) return '';
    var salt = new Buffer(salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

Auth.prototype.login = function (account, profile, callback) {
    var self = this;
    
    if (account) { // Already Logged in
        
        if (account[profile.provider]) { // If the account already has the type of profile logging in with
            return callback('account already has a profile of this type', account);
        }
        
        self.getAccountByProvider(profile, function (err, existingaccount) { // See if we already have an account with this profile
            if (err) { // If the db call went wrong
                return callback(err, account);
            }
            
            if (existingaccount) { // if this profile is already known
                self.client.executeStoredProcedureAsync(createdStoredProcedure._self, {masterAccountId: account.id, childAccountId: existingaccount.id });
            }

            account[profile.provider] = profile; // Add/replace the account profile we are logging in with                                
            
            if (profile.provider === 'Local') { // Local profile login...check password            
                if (self.encryptPassword(profile.password, account.local.salt) != account.local.password) { // Password was wrong
                    return callback('Invalid Credentials!', account);
                }
            }
            
            // Else social login & lets update the profile
            self.updateAccount(account, function (err, account) { // Save the account
                return callback(null, account); // Return the account                
            });

        
        });
                

    }
    
    // Not logged in yet
    self.getAccountByProvider(profile, function (err, account) { // Find the account
        if (err) { // If there was an error retrieving the account
            return callback(err, account || profile); // Bomb out
        }

        if (profile.provider == 'Local') { // If the provider is local
            if (account) { // and if we found an account
                if (self.encryptPassword(profile.password, account.Local.salt) === account.Local.password) { // then check the password
                    return callback(null, account); // and return the account
                }
            }
            return callback('Invalid Credentials!', account || profile); // else password was wrong
        }
        
        if (account) { // If we found an account its not a local account then already auth'd
            return callback(null, account); // so return the account
        }
        
        // Else we have a new login, and so we should register
        self.register(profile, function (err, account) {
            return callback(err, account);
        });
    });
};

Auth.prototype.register = function (profile, callback) {
    var self = this;
    
    self.getAccountByProvider(profile, function (err, account) {
        if (err) {
            return callback(err, account || profile)
        }
        
        if (account) {
            return callback('User already exists', account);
        }
        
        var newUser = {};
        newUser[profile.provider] = profile;
        
        if (newUser.Local) {
            newUser.Local.salt = self.makeSalt();
            newUser.Local.password = self.encryptPassword(newUser.Local.password, newUser.Local.salt);
        }
        
        //create a new account               
        self.docDB.addItem(newUser, function (err, item) {
            callback(err, item || newUser);
        });
    });
};

Auth.prototype.getAccountById = function (id, callback) {
    var self = this;
    var query = u.format(GET_BY_ID, id);
    
    self.docDB.getItem(query, function (err, user) {
        if (err) {
            return callback(err, user || id);
        }
        
        return callback(null, user);
    });
};

Auth.prototype.getAccountByProvider = function (profile, callback) {
    var self = this;
    var query = u.format(GET_BY_PROFILE_ID, profile.provider, profile.providerId)
    
    self.docDB.getItem(query, function (err, account) {
        if (err) {
            return callback(err, account || profile);
        }
        
        return callback(null, account);
    });
};


Auth.prototype.updateAccount = function (account, callback) {
    var self = this;
    self.docDB.updateItem(account, function (e, user) {
        callback(e, user);
    });
};

Auth.prototype.removeAccount = function (id, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.id = "' + id + '"', function (e, user) {
        if (e || !user) {
            return callback(e, user || id);
        }
        
        self.docDB.removeItem(user, function (err, item) {
            return callback(err, item);
        });
    });
};

module.exports = Auth;