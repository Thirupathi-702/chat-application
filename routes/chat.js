const express = require('express');
const { getMessages, sendMessage } = require('../controllers/chat');
const router = express.Router();

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;
