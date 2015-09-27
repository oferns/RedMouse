

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;


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
        auth.getAccount(id, function (err, user) {
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
            auth.register({ "email": email, "password": password }, function (err, user) {
                if (err) {
                    return done(null, false, req.flash('signupMessage', err));
                }
                return done(null, user, req.flash('signupMessage', 'Account created'));
            });
        });
    })),
    
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function (req, email, password, done) { // callback with email and password from our form
        process.nextTick(function () {
            auth.authenticate(email, password, function (err, user) {
                if (err) {
                    return done(err);
                }
                return done(null, user, req.flash('signinMessage', 'Login Successful'));
            });
        });
    })),

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        clientID        : auth.providers.facebookAuth.clientID,
        clientSecret    : auth.providers.facebookAuth.clientSecret,
        callbackURL     : auth.providers.facebookAuth.callbackURL
    },

    // facebook will send back the token and profile
    function (token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function () {
            auth.providerLogin({
                name: profile.displayName, 
                email: profile.emails, 
                provider: 'facebook', 
                providerId: profile.id
            }, done);
        });
    }));
}