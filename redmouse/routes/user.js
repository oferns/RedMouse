
var express = require('express');
var router = express.Router();
var passport = require('passport');
var csrf = require('csurf');

var csrfProtection = csrf({ cookie: true });


router.get("/login", csrfProtection, function (req, res) {
    res.render('login', {
        title: 'Log In',
        user: req.user,
        csrfToken: req.csrfToken()
    });
});

// show the register form
router.get('/register', csrfProtection, function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('register', { csrfToken: req.csrfToken() });
});

router.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile', {
        user : req.user, // get the user out of session and pass to template
    });
});

router.get('/logout', isLoggedIn, function (req, res) {
    req.logout();
    req.flash('info', 'You have been logged out');
    res.redirect('/');
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/profile',
    failureRedirect : '/login'
}));

router.get('/auth/facebook/deauth', function (req, res) {
    debugger;
});


router.get('/auth/google', passport.authenticate('google', { scope : 'email' }));

router.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect : '/profile',
    failureRedirect : '/login'
}));

router.get('/auth/twitter', passport.authenticate('twitter'));

// handle the callback after twitter has authenticated the user
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect : '/profile',
    failureRedirect : '/login'
}));


router.post('/register', csrfProtection, passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
}));


router.post('/login', csrfProtection, passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true, // allow flash messages
    successFlash: true
}));

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    
    // if they aren't redirect them to the home page
    res.redirect('/login');
}

module.exports = router;