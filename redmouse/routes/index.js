// Home

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Red Mouse' });
});

router.get('/style', function (req, res) {
    res.render('style', { title: 'Red Mouse Style Guide' });
});

router.get('/forms', function (req, res) {
    
    req.flash('success', 'This is a success message');
    req.flash('info', 'This is an info message');
    req.flash('warning', 'This is a warning message');
    req.flash('error', 'This is an error message');

    res.render('forms', { title: 'Red Mouse Forms' });
});



module.exports = router;