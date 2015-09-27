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

Auth.prototype.getAccount = function (userId, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.userId = "' + userId + '"', function (e, user) {
        if (!user) {
            return callback(e);
        }
        
        return callback(e, user.profile);
    });
};

Auth.prototype.authenticate = function (userId, password, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.userId = "' + userId + '"', function (e, user) {
        if (e || !user) {
            if (!user) {
                return callback('Invalid User');
            }
            return callback(e);
        }
        
        if (self.encryptPassword(password, user.salt) === user.password) {
            return callback(null, user.profile);
        }
        else {
            return callback('Invalid password');
        }
    });
};

Auth.prototype.isAdmin = function (id, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.userId = "' + id + '"', function (e, user) {
        if (user && user.admin === true) {
            return callback(true);
        }
        return callback(false);
    });
};

Auth.prototype.providerLogin = function (userinfo, callback) {
    var self = this;
    
    self.docDB.getItem('select * from root r where r.providers.' + userinfo.provider + ' = "' + userinfo.providerId + '"', function (e, user) {
        if (user) {
            return callback(e, user);
        }
        
        //create a new user                
        self.createUser(userinfo, function (e, user) {
            return callback(e, user);
        });
    });

};

Auth.prototype.register = function (data, callback) {
    var self = this;
    
    self.getAccount(data.email, function (e, user) {
        if (user) {
            return callback('A user with this email already exists');
        }
        
        data.provider = 'local';
        data.providerId = data.email;
                
        //create a new user                
        self.createUser(data, function (e, user) {
            callback(e, user);
        });
    });

};

Auth.prototype.createUser = function (data, callback) {
    var self = this;
    
    var user = {
        userId: data.email,
        providers: {},
        profile: { userId: data.email, name: data.name, email: data.email }
    }
    
    user.providers[data.provider] = data.providerId;
    
    if (data.password) {
        user.salt = self.makeSalt();
        user.password = self.encryptPassword(data.password, user.salt);
    }
    
    self.docDB.addItem(user, function (e, user) {
        return callback(e, user);
    });
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