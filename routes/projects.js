const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Projects route working');
});

module.exports = router;