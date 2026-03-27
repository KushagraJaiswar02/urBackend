const express = require('express');
const router = express.Router();
const verifyApiKey = require('../middlewares/verifyApiKey');
const resolvePublicAuthContext = require('../middlewares/resolvePublicAuthContext');
const authorizeWriteOperation = require('../middlewares/authorizeWriteOperation');
const projectRateLimiter = require('../middlewares/projectRateLimiter');
const { insertData, getAllData, getSingleDoc, updateSingleData, deleteSingleDoc } = require("../controllers/data.controller")


// POST REQ TO INSERT DATA
router.post('/:collectionName', verifyApiKey, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, insertData);


// GET REQ ALL DATA
router.get('/:collectionName', verifyApiKey, projectRateLimiter, getAllData);


// GET REQ SINGLE DATA
router.get('/:collectionName/:id', verifyApiKey, projectRateLimiter, getSingleDoc);


// DELETE REQ SINGLE DATA
router.delete('/:collectionName/:id', verifyApiKey, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, deleteSingleDoc);



// PUT REQ SINGLE DATA
router.put('/:collectionName/:id', verifyApiKey, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, updateSingleData);

// PATCH REQ SINGLE DATA
router.patch('/:collectionName/:id', verifyApiKey, resolvePublicAuthContext, projectRateLimiter, authorizeWriteOperation, updateSingleData);


module.exports = router;
