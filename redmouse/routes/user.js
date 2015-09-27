
var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get("/login", function (req, res) {
    res.render('login', {
        title: 'Log In', message: req.flash('loginMessage')
    });
});

// show the register form
router.get('/register', function (req, res) {    
    // render the page and pass in any flash data if it exists
    res.render('register', { message: req.flash('signupMessage') });
});

router.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile', {
        user : req.user, // get the user out of session and pass to template
        message: req.flash('signupMessage')
    });
});

router.get('/logout', isLoggedIn, function (req, res) {
    req.logout();
    req.flash('logoutMessage', 'You have been logged out');
    res.redirect('/');
});

router.post('/register', passport.authenticate('local-signup', {
    successRedirect : '/profile',
    failureRedirect : '/register',
    failureFlash : true, 
    successFlash : true
}));


router.post('/login', passport.authenticate('local-login', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));





function isLoggedIn(req, res, next) {
    
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();
    
    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;