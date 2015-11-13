'use strict';

var GET_BY_ID = 'SELECT * FROM root r WHERE r.id = "%s"';
var GET_BY_PROFILE_ID = 'SELECT * FROM root r WHERE r.%s.providerId = "%s"';

var u = require('util')
var async = require('async');
var crypto = require('crypto');

var friendlyUrl = require('friendly-url'); // used for generating user slugs

var DocDBUtils = require('./DocDBUtils');

function Auth(providers, documentClient, databaseId, collectionId, smtp) {
    var self = this;
    
    self.providers = providers;
    self.client = documentClient;
    self.databaseId = databaseId;
    self.collectionId = collectionId;
    self.smtp = smtp;
    
    self.database = null;
    self.collection = null;
}


Auth.prototype.init = function (callback) {
    var self = this;
    
    DocDBUtils.getOrCreateDatabase(self.client, self.databaseId, function (err, db) {
        if (err) {
            callback(err);
        }
        
        self.database = db;
        DocDBUtils.getOrCreateCollection(self.client, self.database._self, self.collectionId, function (err, coll) {
            if (err) {
                callback(err);
            }
            
            self.collection = coll;
            
            var mergeAccountsStoredProc = {
                id: "mergeAccounts",
                body: function (masterAccountId, childAccountId) { // profileId = The Master profile receiving the childId profile
                    
                    var context = getContext();
                    var collection = context.getCollection();
                    var response = context.getResponse();
                    
                    var query = 'SELECT * FROM root r WHERE r.id = "%s"';
                    
                    var masterAccount = collection.queryDocuments(u.format(query, masterAccountId)).toArray(function (err, results) {
                        if (err) {
                            throw err;
                        }
                        
                        if (results.length == 0) {
                            return null;
                        }
                        
                        if (results.length > 1) {
                            throw u.format('Warning: %d results returned. Expected 1 or 0.', results.length, results);
                        }
                        
                        return results[0];
                    });
                    
                    if (masterAccount === 'undefined') {
                        throw u.format('Could not find master account %s', masterAccountId);
                    }
                    
                    var childAccount = collection.queryDocuments(u.format(query, childAccountId)).toArray(function (err, results) {
                        if (err) {
                            return callback(err);
                        }
                        
                        if (results.length == 0) {
                            return callback(null, null);
                        }
                        
                        if (results.length > 1) {
                            return callback(u.format('Warning: %d results returned. Expected 1 or 0.', results.length, results));
                        }
                        
                        return callback(null, results[0]);
                    });
                    
                    if (childAccount === 'undefined') {
                        throw u.format('Could not find child account %s', childAccountId);
                    }
                }
            }
            
            var querySpec = {
                query: 'SELECT * FROM root r WHERE r.id=@id',
                parameters: [{
                        name: '@id',
                        value: mergeAccountsStoredProc.id
                    }]
            };
            
            self.client.queryStoredProcedures(self.collection._self, querySpec, {}, function (err, documents, responseOptions) {
                if (err) {
                    throw new Error("Error" + err.message);
                }
                if (documents.length == 0) {
                    self.client.createStoredProcedure(self.collection._self, mergeAccountsStoredProc, function (err, response) {
                        if (err) {
                            throw new Error("Error" + err.message);
                        }
                        
                        self.mergeAccountsProc = response.resource;
                    });
                } else {
                    self.mergeAccountsProc = documents[0];
                }
            
            });
        });
    });
};

Auth.prototype.makeSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

Auth.prototype.makeResetLink = function () {
    return crypto.randomBytes(20).toString('base64');
};


Auth.prototype.makeResetEmail = function (account) {
    var email = new smtp.Email({
        to: account.Local.id,
        from: 'info@theredmouse.co.uk',
        subject: 'Password Reset',
        text: u.format('Hi %s,\n\nPlease click on the following link, or paste this into your browser to change your password:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n', account.Local.name, account.resetLink),
        // html: u.format('')
    });
    
    
    email.setFilters({
        'footer': {
            'settings': {
                'enable': 1,
                'text/plain': 'The red mouse.'
            }
        }
        ,
        'clicktrack': {
            'settings': {
                'enable': 1
            }
        }
    });
    
    return email;
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
                self.client.executeStoredProcedure(self.mergeAccountsProc, { masterAccountId: account.id, childAccountId: existingaccount.id });
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
        self.register(null, profile, function (err, account) {
            return callback(err, account);
        });
    });
};

Auth.prototype.register = function (account, profile, callback) {
    var self = this;
    
    self.getAccountByProvider(profile, function (err, existingAccount) {
        if (err) {
            return callback(err, existingAccount || profile)
        }
        
        if (existingAccount) {
            return callback('User already exists', existingAccount);
        }
        
        
        var newUser = account ? account : {};
        newUser[profile.provider] = profile;
        
        if (newUser.Local) {
            newUser.Local.salt = self.makeSalt();
            newUser.Local.password = self.encryptPassword(newUser.Local.password, newUser.Local.salt);
        }
        
        if (!account) {
            // add a id
            newUser['id'] = friendlyUrl(profile.name);
            // and an easy display name
            newUser['displayName'] = profile.name;
            
            // TODO: Check the slug for uniqueness and add a random extension. Idea is it can be changed later. Needs thought

            //create a new account
            self.client.createDocument(self.collection._self, newUser, function (err, newAccount) {
                if (err) {
                    callback({ code:err.code, message: err.body });
                } else {
                    callback(null, newAccount);
                }
            });
        }
        else {
            self.updateAccount(account, callback);
        }
    });
};

Auth.prototype.getAccountById = function (id, callback) {
    var self = this;
    var query = u.format(GET_BY_ID, id);
    
    self.client.queryDocuments(self.collection._self, query).toArray(function (err, results) {
        if (err) {
            return callback(err);
        }
        
        if (results.length == 0) {
            return callback(null, null);
        }
        
        if (results.length > 1) {
            return callback(u.format('Warning: %d results returned. Expected 1 or 0.', results.length, results));
        }
        
        return callback(null, results[0]);
    });
};

Auth.prototype.getAccountByProvider = function (profile, callback) {
    var self = this;
    var query = u.format(GET_BY_PROFILE_ID, profile.provider, profile.providerId)
    
    self.client.queryDocuments(self.collection._self, query).toArray(function (err, results) {
        if (err) {
            return callback(err);
        }
        
        if (results.length == 0) {
            return callback(null, null);
        }
        
        if (results.length > 1) {
            return callback(u.format('Warning: %d results returned. Expected 1 or 0.', results.length, results));
        }
        
        return callback(null, results[0]);
    });
};

Auth.prototype.updateAccount = function (account, callback) {
    var self = this;
    self.client.replaceDocument(account._self, account, function (err, replaced) {
        if (err) {
            callback(err);
        } else {
            callback(null, replaced);
        }
    });
};

Auth.prototype.removeAccount = function (id, callback) {
    var self = this;
    self.getAccountById(id, function (err, account) {
        if (err) {
            callback(err);
        } else {
            self.client.deleteDocument(account._self, null, function (err, account) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, account)
                }
            });
        }
    });
};

Auth.prototype.resetPassword = function (user, callback) {
    var self = this;
    
    self.getAccountByProvider(user, function (err, account) { // Find the account
        if (err) {
            callback(err, user);
        }
        
        if (!account || !account.local) {
            callback('Account not found', user);
        }
        
        account.local.resetToken = self.makeResetLink();
        account.local.resetTokenExpires = Date.now() + 3600000; // 1 hour
        
        self.updateAccount(account, function (err, acc) {
            if (err) {
                callback(err, acc);
            }
            
            smtp.send(self.makeResetEmail(acc));
                
            callback(null, acc);

        });
    });

};

module.exports = Auth;