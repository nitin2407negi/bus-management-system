// // routes/authRoutes.js
// const express = require('express');
// const router = express.Router();
// const authController = require("../controllers/authController.js");

// router.post('/register', authController.register);
// router.post('/login', authController.login );

// module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");

router.post("/register/request", auth.requestRegistrationOTP);
router.post("/register/verify", auth.verifyRegistrationOTP);
router.post("/login/request", auth.requestLoginOTP);
router.post("/login/verify", auth.verifyLoginOTP);

module.exports = router;

