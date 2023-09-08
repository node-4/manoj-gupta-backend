const express = require('express');
const router = express.Router();
const termsController = require('../controllers/terms.controller');
const { authJwt } = require('../middleware');

// GET all terms and conditions
router.post('/admin/terms', termsController.getAllTerms);

// GET a single term and condition by ID
router.get('/admin/terms/:id', termsController.getTermById);

// CREATE a new term and condition
router.post('/admin/terms', [authJwt.isAdmin], termsController.createTerm);

// UPDATE a term and condition by ID
router.put('/admin/terms/:id', [authJwt.isAdmin], termsController.updateTerm);

// DELETE a term and condition by ID
router.delete('/admin/terms/:id', [authJwt.isAdmin], termsController.deleteTerm);

// users
router.get('/terms', termsController.getAllTerms);

// GET a single term and condition by ID
router.get('/terms/:id', termsController.getTermById);

module.exports = router;
