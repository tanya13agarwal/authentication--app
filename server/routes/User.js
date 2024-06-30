// Import the required modules
const express = require("express")
const router = express.Router();

const {signup, login, sendotp} = require('../controllers/Auth');


router.post("/signup",signup);
router.post("/login",login);

// sending OTP to the user's email for email verification
router.post("/sendotp", sendotp)

// Export the router for use in the main application
module.exports = router
