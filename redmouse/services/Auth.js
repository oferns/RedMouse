'use strict';

var async = require('async');
var crypto = require('crypto');

var DocDB = require('./docdb.js');


function Auth(options) {
    var self = this;
    self.docDB = new DocDB(options.docDb);
    self.providers = options.authproviders;
}

Auth.prototype.makeSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

Auth.prototype.encryptPassword = function (password, salt) {
    if (!password || !salt) return '';
    var salt = new Buffer(salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

Auth.prototype.getAccount = function (id, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.id = "' + id + '"', function (e, user) {
        if (!user) {
            return callback(e, userId);
        }
        return callback(e, user);
    });
};

Auth.prototype.providerLogin = function (profile, callback) {
    var self = this;
    self.getAccountByProvider(profile, function (err, user) {
        if (err) {
            return callback(err);
        }
             
        if (profile.provider === 'Local') {
            if (user) {
                if (self.encryptPassword(profile.password, user.local.salt) === user.local.password) {
                    return callback(null, user);
                }
            }
            return callback('Invalid Credentials!');
        }
        
        if (user) {
            return callback(null, user);
        }
        
        //create a new user                
        self.createUser(profile, function (err, user) {
            return callback(err, user);
        });
    });

};

Auth.prototype.getAccountById = function (userId, callback) {
    var self = this;
    self.docDB.getItem('select * from root r where r.id = "' + userId + '"', function (err, user) {
        if (err) {
            return callback(err, userId);
        }
        
        return callback(null, user);
    });
};

Auth.prototype.getAccountByProvider = function (profile, callback) {
    var self = this;
    self.docDB.getItem('select * from root r where r.' + profile.provider + '.providerId = "' + profile.providerId + '"', function (err, user) {
        if (err) {
            return callback(err, profile);
        }

        return callback(null, user);
    });
};

Auth.prototype.register = function (profile, callback) {
    var self = this;
    
    self.getAccountByProvider(profile, function (e, user) {

        if (user) {
            return callback('A user with this email already exists');
        }
        
        //create a new user                
        self.createUser(profile, function (e, user) {
            callback(e, user);
        });
    });

};

Auth.prototype.createUser = function (profile, callback) {
    var self = this;
    
    if (profile.password) {
        profile.salt = self.makeSalt();
        profile.password = self.encryptPassword(profile.password, profile.salt);
    }

    var json = {};
    json[profile.provider] = profile;
    
    self.docDB.addItem(json, callback);
};

Auth.prototype.updateUser = function (data, callback) {
    var self = this;
    
    self.getAccount(data.userId, function (e, user) {
        if (e || !user) {
            return callback('error updating user');
        }
        
        //check for changed password
        if (data.newPassword && data.password && encryptPassword(data.password, user.salt) === user.password) {
            user.providers.salt = self.makeSalt();
            user.providers.local = self.encryptPassword(data.newPassword, user.providers.salt);
        }
        
        user.profile = data.profile;
        user.profile.userId = user.userId;
        
        //update a new user                
        self.docDB.updateItem(user, function (e) {
            callback(e, user);
        });
    });
};

Auth.prototype.removeAccount = function (userId, callback) {
    var self = this;
    
    if (userId === 'admin') {
        callback('Error: You cannot delete the admin account');
    }
    
    self.docDB.getItem('select * from root r where r.userId = "' + userId + '"', function (e, user) {
        if (e || !user) {
            return callback(e);
        }
        
        self.docDB.removeItem(user, function (e) {
            return callback(e);
        });
    });
};



module.exports = Auth;