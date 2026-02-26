const express = require('express');
const router = express.Router();
const fuelController = require('../controllers/fuel.controller');

router.get('/price', fuelController.getFuelPrice);

module.exports = router;
