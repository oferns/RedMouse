var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Red Mouse' });
});

router.get('/style', function (req, res) {
    res.render('style', { title: 'Red Mouse Style Guide' });
});



module.exports = router;