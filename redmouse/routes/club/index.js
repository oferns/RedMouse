var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('club/index', { title: 'Red Mouse' });
});


module.exports = router;