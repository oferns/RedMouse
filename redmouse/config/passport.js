﻿
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

module.exports = function (passport, auth) {
    
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    
    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    
    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        auth.getAccountById(id, function (err, user) {
            done(err, user);
        });
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'    
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },    
   function (req, email, password, done) {
        process.nextTick(function () {
            auth.register({
                providerId: email, 
                password: password,
                provider: 'local',
                email: email,
                emailConfirmed: false
            }, function (err, user) {
                if (!err) {
                    req.flash('success', 'Registration succeeded!');
                    req.user = user;
                    return done(null, user)
                }
                req.flash('warning', 'Registration failed!');
                return done(err, false);
            });
        });
    })),
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },

    function (req, email, password, done) { // callback with email and password from our form
        process.nextTick(function () {
            auth.providerLogin({
                providerId: email, 
                password: password,
                provider: 'Local',
                email: email,
                providerProfile: {}
            }, function (err, user) {
                if (!err) {
                    req.flash('success', 'Login succeeded!');
                    req.user = user;
                    return done(null, user)
                }
                req.flash('warning', 'Login failed!');
                return done(err, false);
            });
        });
    })),

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        clientID        : auth.providers.facebookAuth.clientID,
        clientSecret    : auth.providers.facebookAuth.clientSecret,
        callbackURL     : auth.providers.facebookAuth.callbackURL,
        passReqToCallback : true

    },

    // facebook will send back the token and profile
    function (req, token, refreshToken, profile, done) {
        process.nextTick(function () {
            auth.providerLogin({
                name: profile.displayName, 
                email: profile.emails, 
                provider: 'Facebook', 
                providerId: profile.id,
                token: token,
                refreshToken: refreshToken,
                providerProfile: profile
            }, function (err, user) {
                if (!err) {
                    req.flash('success', 'Login succeeded!');
                    req.user = user;
                    return done(null, user)
                }
                req.flash('warning', 'Login failed!');
                return done(err, false);
            });
        });
    })),
    
    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
        clientID        : auth.providers.googleAuth.clientID,
        clientSecret    : auth.providers.googleAuth.clientSecret,
        callbackURL     : auth.providers.googleAuth.callbackURL,
        passReqToCallback : true
    },

    function (req, token, refreshToken, profile, done) {
        
        process.nextTick(function () {
            auth.providerLogin({
                name: profile.displayName, 
                email: profile.emails, 
                provider: 'Google', 
                providerId: profile.id,
                token: token,
                refreshToken: refreshToken,
                providerProfile: profile
            }, function (err, user) {
                if (!err) {
                    req.flash('success', 'Login succeeded!');
                    req.user = user;
                    return done(null, user)
                }
                req.flash('warning', 'Login failed!');
                return done(err, false);
            });
        });
    }));
    
    // =========================================================================
    // Twitter ==================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({
        consumerKey      : auth.providers.twitterAuth.consumerKey,
        consumerSecret   : auth.providers.twitterAuth.consumerSecret,
        callbackURL      : auth.providers.twitterAuth.callbackURL,
        passReqToCallback : true
    },

    function (req, token, tokenSecret, profile, done) {
        
        process.nextTick(function () {
            auth.providerLogin({
                name: profile.displayName, 
                email: profile.emails, 
                provider: 'Twitter', 
                providerId: profile.id,
                token: token,
                tokenSecret: tokenSecret,
                providerProfile: profile
            }, function (err, user) {
                if (!err) {
                    req.flash('success', 'Login succeeded!');
                    req.user = user;
                    return done(null, user)
                }
                req.flash('warning', 'Login failed!');
                return done(err, false);
            });
        });
    }));
}