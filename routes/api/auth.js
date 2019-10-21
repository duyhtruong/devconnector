const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');


// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/',auth, async (req,res)=> {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');

    }
});


// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/',
    [
    check('email', 'Please include a valid emaile').isEmail(),
    check('password', 'Password is required').exists()
    ],
async (req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    // pull out name, email, password out of req.body
    const { email, password } = req.body;

    try{
        let user = await User.findOne({email: email});

        //Checks if user exists in database
        if(!user){
            return res
            .status(400)
            .json({errors: [{msg:'Invalid Credentials'}]});
        }
    

        //use bcrypt compare to match plain text pw with hashed pw

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res
                .status(400)
                .json({error:[{msg: 'Invalid Credentials'}]})
        }

    //Return jsonwebtoken
        
        const payload ={
            user:{
                id: user.id
            }
        }    

        //sign jwt token
        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000}, 
            (err, token)=>{
                if(err) throw err;
                res.json({token});
            }
            );

    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }

    });



module.exports = router;