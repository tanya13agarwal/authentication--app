const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const OTP = require("../models/Otp");
const otpGenerator = require("otp-generator");

exports.signup = async(req, res) => {

    try{
        const { name, username, email, phoneNo, dob, password, otp } = req.body;

        // check if user already exist or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: `User already exists.`,
            })
        }

        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
        console.log(response)
        if (response.length === 0) {
        // OTP not found for the email
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
        })
        } else if (otp !== response[0].otp) {
        // Invalid OTP
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
        })
        }

        // if !user then create one such user
        // hash password and then create a user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            username,
            email,
            phoneNo,
            dob,
            password: hashedPassword,
        });

        // now login this user
        const token = jwt.sign( { email: email, id: user._id }, process.env.JWT_SECRET );
        res.cookie("token", token).status(200).json({
            success: true,
            token,
            user,
            message: `registered and logged in succesfully`
        })

        // return res.status(200).json({
        //     success: true,
        //     message: 'User is registered successfully',
        //     user, 
        // });

    }

    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: `User cannot be registered, Please try again.`,
        })
    }
}

exports.login = async(req, res) => {

    try{
        
        const {username, email, phoneNo, password} = req.body;
        // console.log(" eh ce", req.body);

        // search for existing user
        const user = await User.findOne({username}) || await User.findOne({email}) || await User.findOne({phoneNo});

        // second method
        // let user;
        // if(username){
        //     user = await User.findOne({username});
        // }
        // else if(email){
        //     user = await User.findOne({email});
        // }
        // else if(phoneNo){
        //     user = await User.findOne({phoneNo});
        // }

        console.log("dnejbcv: ",user);

        // if user do not exist, return error response
        if(!user){
            // Return 401 Unauthorized status code 
            return res.status(401).json({
                success: false,
                message: 'User is not registered, please signup first.',
            })
        }
        
        // password matching and compare password
        if(await bcrypt.compare(password, user.password)){
            // create jwt token
            const token = jwt.sign({ email: user.email, id: user._id},
				process.env.JWT_SECRET,
				{
					expiresIn: "24h",
				}
			);

            // Save token to user document in database
            user.token = token; 
            user.password = undefined;

            // create cookie and send response
            const options = {
                // expires after 3 days
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            };
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User logged in succesfully`
            })
        }
        else{
            return res.status(401).json({
                success: false, 
                message: `Password is incorrect`,
            });
        }
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: `User cannot be logged in, Please try again.`,
        })
    }

}

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {

    try {

      const { email } = req.body
  
      // if user already exists
      const userExist = await User.findOne({ email })
      if (userExist) {
        // Return 401 Unauthorized status code
        return res.status(401).json({
          success: false,
          message: `User is Already Registered`,
        })
      }
  
      // else generate otp
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      })
      const result = await OTP.findOne({ otp: otp })
    //   console.log("Result is Generate OTP Func")
      console.log("OTP", otp)
      console.log("Result", result);
      while (result) {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
        })
      }

      // create an otp object
      const otpPayload = { email, otp }
      const otpBody = await OTP.create(otpPayload);
      console.log("OTP Body", otpBody);
      
      res.status(200).json({
        success: true,
        message: `OTP Sent Successfully`,
        otp,
      })
    }
    
    catch (error) {
      console.log(error.message)
      return res.status(500).json({ success: false, error: error.message })
    }

  }