const express = require('express');
const { listUsers } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// lista todos los usuarios registrados, para elegir con quien chatear
router.get('/', requireAuth, listUsers);

module.exports = router;
