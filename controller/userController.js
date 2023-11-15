const Customer = require("../model/customerModel")
const Category = require("../model/categoryModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")
const Order = require("../model/orderModel")
const Coupon=require("../model/coupon")
const jwt = require("jsonwebtoken")
require('dotenv').config()





const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
    return jwt.sign({ id }, process.env.USER_JWT_SECRETKEY, {
        expiresIn: maxAge
    });
};


const securePassword = async (password) => {
    try {
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            return passwordHash;
        }

    } catch (err) {
        console.log(err.message)
        
    }
}

const loadUserLogin = async (req, res) => {
    const category = await Category.find({ list: true })
    res.render("userLogin", { category: category })
}




const insertUser = async (req, res, next) => {
    try {
        const category = await Category.find({ list: true })
    const checkEmail = await Customer.findOne({ email: req.body.email })
    const ref=req.body.referral
    const user=null
    if(ref.trim().length>0){
        const userRef=await Customer.findOne({referralCode:ref})
        if(!userRef){
            return res.render("userSignUp", { message: "Invalid Referral", category: category,user })
        }
    }
    if (checkEmail) {
        res.render("userSignUp", { message: "Email already exists", category: category })
    }
    else if (req.body.password !== req.body.confirmPassword) {
        res.render("userSignUp", { message: "Password is not Matching", category: category })
    }
    else {
        const sPassword = await securePassword(req.body.password)
        const user = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            password: sPassword,
            referralCode:req.body.referral

        }
        req.session.temp = user
        res.redirect("/sentOtp")
    }
    } catch (error) {
        console.log(error)
        const errorMessage = "Internal Server Error";
        return res.status(500).render("errorPage", { statusCode: 500, errorMessage });
    }
    

}




const loadUserSignUp = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
    res.render("userSignUp", { category: category })
    } catch (error) {
     console.log(error); 
     const statusCode = 500;
     const errorMessage = 'An error occurred while loading the sign-up page. Please try again later.';
     res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
    
}




const verifyUser = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const category = await Category.find({ list: true })
    const userData = await Customer.findOne({ email: email })
    if (userData) {
        if (userData.status) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                const token = createToken(userData._id);
                res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
                res.redirect("/userHome");
            }
            else {
                res.render("userLogin", { message: "Invalid Password", category: category })
            }

        } else {
            res.render("userLogin", { message: "Your account has been blocked by Admin", category: category })
        }

    }
    else {
        res.render("userLogin", { message: "Invalid Email", category: category })
    }
}

const sendOtp = async (req, res) => {
    try {
        const email = req.session.temp.email;
        let otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        req.session.sampleOtp = otpCode
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_NAME,
                pass: process.env.USER_PASSWORD
            }
        });
        const mailOptions = {
            from: process.env.USER_NAME,
            to: email,
            subject: "Verification Code",
            text: `Your OTP code is: ${otpCode}`
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.error("Error sending email: ", err);
                const statusCode = 500;
                const errorMessage = "Failed to send OTP email";
                res.status(statusCode).render('errorPage', { statusCode, errorMessage });
                return otpCode
            } else {
                console.log("Email sent: " + info.response);
                res.redirect('/otp')
            }
        });

    } catch (error) {
        console.error("Error: ", error);
        const statusCode = 500;
        const errorMessage = "Failed to send OTP email";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};


const otp = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
    res.render("otpPage", { category: category })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Something went wrong";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
    
}

function referralGenerator(){
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);

    
    const ref = `REF-${timestamp}${random}`;
    return ref;
}

const verifyOtp = async (req, res) => {
    const formOtp = req.body.otp
    const formOtps = formOtp.toString()
    const sOtp = req.session.sampleOtp
    const referralCode=referralGenerator()

    const category = await Category.find({ list: true })
    if (formOtps === sOtp) {
        const cust = req.session.temp
        const user = new Customer({
            name: cust.name,
            email: cust.email,
            mobile: cust.mobile,
            password: cust.password,
            cartTotal: 0,
            is_admin: 0,
            status: true,
            referralCode:referralCode,
            usedReferral:cust.referralCode,
            referralPurchase:false,
            wallet:0,
            date: new Date()
        })
        const userData = await user.save()
       
        if (userData) {
            const token = createToken(userData._id);
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
            res.redirect("/userHome")
        }
        else {
            res.render("userSignUp", { category: category })
        }
    } else {
        res.render("otpPage", { message: "Wrong Otp", category: category })
    }
}


const loginOtp = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        res.render("userLoginOtp", { category: category })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "something went wrong";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
   
}

var OTP
const sendOtpLogin = async (req, res) => {
    try {
        const email = req.body.email;
        let otpCodeLogin = Math.floor(1000 + Math.random() * 9000).toString();
        OTP = otpCodeLogin


        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_NAME,
                pass: process.env.USER_PASSWORD
            }
        });
        const mailOptions = {
            from: process.env.USER_NAME,
            to: email,
            subject: "Verification Code",
            text: `Your OTP code is: ${otpCodeLogin}`
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.error("Error sending email: ", err);
                return otpCodeLogin
            } else {
                console.log("Email sent: " + info.response);

            }
        });

    } catch (error) {
        console.error("Error: ", error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};


const verifyLoginOtp = async (req, res) => {
    const email = req.body.email
    const otp = req.body.otp
    const category = await Category.find({ list: true })

    const otpString = otp.toString()
    //    const otpCode=req.session.otpCodeLogin
    //    console.log(req.session);


    const userData = await Customer.findOne({ email: email })
    if (userData) {

        if (userData.status) {
            if (otpString == OTP) {
                const token = createToken(userData._id);
                res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
                res.redirect("/userHome")
            }
            else {
                res.render("userLoginOtp", { message: "Invalid OTP", category: category })
            }
        } else {
            res.render("userLoginOtp", { message: "Your account has been blocked by Admin", category: category })
        }

    }
    else {
        res.render("userLoginOtp", { message: "Invalid Email", category: category })
    }
}





const forgotPasswordPage1 = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        res.render("forgotPassword1", { category: category })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });

    }
}

var forgotOtp, forgotMail
const forgotPassword1 = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        const email = req.body.email;
        const user = await Customer.findOne({ email: email })
        if (user) {
            forgotMail = email
            let otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            forgotOtp = otpCode


            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.USER_NAME,
                    pass: process.env.USER_PASSWORD
                }
            });
            const mailOptions = {
                from: process.env.USER_NAME,
                to: email,
                subject: "Reset Password",
                text: `Your OTP code for password reset is: ${otpCode}`
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.error("Error sending email: ", err);
                    return otpCode
                } else {
                    console.log("Email sent: " + info.response);
                    res.redirect("/forgotPassword")

                }
            });
        } else {
            res.render("forgotPassword1", { message: "You are not a User.Create New Account!", category: category })
        }

    } catch (error) {
        console.error("Error: ", error);
        const statusCode = 500;
        const errorMessage = "Failed to send otp mail";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });

    }
}


const forgotPasswordPage = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        res.render("forgotPassword", { category: category })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const forgotPassword = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        if (req.body.otp === forgotOtp) {
            if (req.body.newPassword === req.body.confirmPassword) {
                const sPassword = await securePassword(req.body.newPassword)
                const forgot = await Customer.updateOne({ email: forgotMail }, { $set: { password: sPassword } })
                res.redirect("/user/login")

            } else {
                res.render("forgotpassword", { message: "Password mismatching", category: category })
            }
        } else {
            res.render("forgotpassword", { message: "Wrong OTP", category: category })
        }


    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const logout = async (req, res) => {
    try {
        await res.cookie('jwt', '', { maxAge: 1 })
        res.redirect("/")
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}










const accountDetailsPage = async (req, res) => {
    try {
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const category = await Category.find({ list: true })
        res.render("accountDetails", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const userProfileEditPage = async (req, res) => {
    try {
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const category = await Category.find({ list: true })
        res.render("editProfileDetails", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}
// let profileEdit=
let profileOtp, profileDetail
const userProfileEdit = async (req, res) => {
    try {
        const detail = {
            name: req.body.name.trim(),
            email: req.body.email.trim(),
            mobile: req.body.mobile.trim(),
            id: req.body.id

        }
        profileDetail = detail

        const userData = await Customer.findOne({ _id: req.body.id })
        // const usersData=await Customer.findOne({_id:res.locals.user._id})
        const category = await Category.find({ list: true })
        let email = req.body.email
        // const useremail=await Customer.findOne({email:email})
        // if(useremail){
        // res.render("editProfileDetails",{message:"Email Already Exists",category:category})
        // }else{
        if (req.body.email.trim() == userData.email) {
            const saved = await Customer.updateOne({ _id: req.body.id }, { $set: { name: req.body.name.trim(), email: req.body.email.trim(), mobile: req.body.mobile.trim() } })
            res.redirect("/userAccount")
        }
        else {
            let otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            profileOtp = otpCode


            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.USER_NAME,
                    pass: process.env.USER_PASSWORD
                }
            });
            const mailOptions = {
                from: process.env.USER_NAME,
                to: email,
                subject: "Reset Password",
                text: `Your OTP code for password reset is: ${otpCode}`
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.error("Error sending email: ", err);
                    return otpCode
                } else {
                    console.log("Email sent: " + info.response);
                    res.redirect("/profileOtp")

                }
            });
        }
        // }

    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const verifyProfilePage = async (req, res) => {
    try {

        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        res.render("verifyProfile", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const verifyProfile = async (req, res) => {
    try {
        // console.log(profileDetail);
        // const userData=await Customer.findOne({_id:profileDetail.id})
        const otp = req.body.otp
        const otpString = otp.toString()
        const category = await Category.find({ list: true })
        if (profileOtp === otpString) {
            const saving = await Customer.updateOne({ _id: profileDetail.id }, { $set: { name: profileDetail.name, email: profileDetail.email, mobile: profileDetail.mobile } })
            res.redirect("/userAccount")
        } else {
            res.render("verifyProfile", { message: "Invalid OTP", category: category })
        }

    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const userAddressPage = async (req, res) => {
    try {
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        console.log(userData)

        const category = await Category.find({ list: true })
        res.render("userAddress", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const addAddressPage = async (req, res) => {
    try {

        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })

        res.render("userAddAddress", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const addAddress = async (req, res) => {
    try {

        const address = {
            name: req.body.name,
            houseName: req.body.houseName,
            street: req.body.street,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
            pin: req.body.pin
        }
        let id = req.body.id
        const users = await Customer.findOne({ _id: id })
        if (users) {
            users.address.push(address)
            await users.save()
            res.redirect("/userAddress")
        } else {
            return res.status("404").json({ error: "No user found" })
        }

    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const addAddressCheckout = async (req, res) => {
    try {

        const address = {
            name: req.body.name,
            houseName: req.body.houseName,
            street: req.body.street,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
            pin: req.body.pin
        }
        let id = req.body.id
        const users = await Customer.findOne({ _id: id })
        if (users) {
            users.address.push(address)
            await users.save()
            res.redirect("/checkout")
        } else {
            return res.status(404).render('errorPage', { statusCode:"404", errorMessage:"No user found" })
        }

    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const editAddressPage = async (req, res) => {
    try {
        const id = req.params.id
        const category = await Category.find({ list: true })
        const usersData = await Customer.findOne({ _id: res.locals.user._id })
        const userData = usersData.address.id(id)


        res.render("userEditAddress", { category: category, userData: userData, usersData: usersData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const editAddressCheckoutPage = async (req, res) => {
    try {
        const id = req.params.id
        const category = await Category.find({ list: true })
        const usersData = await Customer.findOne({ _id: res.locals.user._id })
        const userData = usersData.address.id(id)


        res.render("editAddressCheckout", { category: category, userData: userData, usersData: usersData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


// const editAddress=async (req,res)=>{
//     try {
//         const name=req.body.name
//         const houseName=req.body.houseName
//         const street=req.body.street
//         const city=req.body.city
//         const district=req.body.district
//         const state=req.body.state
//         const pin=req.body.pin

//         let id=req.body.id
//         let mainId=req.body.mainId
//         const users=await Customer.findByIdAndUpdate({_id:mainId,"address._id":id},{
//             $set:{
//                 "address.name":name,
//                 "address.houseName":houseName,
//                 "address.street":street,
//                 "address.city":city,
//                 "address.district":district,
//                 "address.state":state,
//                 "address.pin":pin
//             }
//         })
//         console.log(users);
//         if(users){

//             res.redirect("/userAddress")
//         }else{
//             return res.status("404").json({error:"No user found"})
//         }

//     } catch (error) {
//         console.log(error);
//     }
// }




const editAddress = async (req, res) => {
    try {
        const name = req.body.name;
        const houseName = req.body.houseName;
        const street = req.body.street;
        const city = req.body.city;
        const district = req.body.district;
        const state = req.body.state;
        const pin = req.body.pin;

        let id = req.body.id;
        let mainId = req.body.mainId;

        const users = await Customer.updateOne(
            {
                _id: mainId,
                "address._id": id
            },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.houseName": houseName,
                    "address.$.street": street,
                    "address.$.city": city,
                    "address.$.district": district,
                    "address.$.state": state,
                    "address.$.pin": pin
                }
            }
        );

        if (users) {
            res.redirect("/userAddress");
        } else {
            return res.status(404).render('errorPage', { statusCode:"404", errorMessage:"No user found or address not modified" })

        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};




const editAddressCheckout = async (req, res) => {
    try {
        const name = req.body.name;
        const houseName = req.body.houseName;
        const street = req.body.street;
        const city = req.body.city;
        const district = req.body.district;
        const state = req.body.state;
        const pin = req.body.pin;

        let id = req.body.id;
        let mainId = req.body.mainId;

        const users = await Customer.updateOne(
            {
                _id: mainId,
                "address._id": id
            },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.houseName": houseName,
                    "address.$.street": street,
                    "address.$.city": city,
                    "address.$.district": district,
                    "address.$.state": state,
                    "address.$.pin": pin
                }
            }
        );

        if (users) {
            res.redirect("/checkout");
        } else {
            return res.status(404).render('errorPage', { statusCode:"404", errorMessage:"No user found or address not modified" })
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};


const deleteAddress = async (req, res) => {
    try {
        const id = req.params.id
        const deleted = await Customer.updateOne(
            { _id: res.locals.user._id },
            { $pull: { address: { _id: id } } }
        )
        if (deleted) {
            res.redirect("/userAddress")
        }
        else {
            return res.status(404).render('errorPage', { statusCode:"404", errorMessage:"error on deletion" })
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



// const updateQuantity = async (req, res) => {
//     try {
//         console.log("hello");
//         const itemId = req.body.itemId;
//         const operation = req.body.operation;

//         const user = await Customer.findOne({ _id: res.locals.user._id, "cart._id": itemId });
//         if (user) {
//             const cartItem = user.cart.find((item) => item._id.toString() === itemId);
//             if (cartItem) {
//                 const productId = cartItem.productId; // Assuming the productId is stored in the cartItem

//                 const product = await Product.findById(productId);
//                 if (product) {
//                     // Update quantity and calculate new subtotal
//                     cartItem.quantity = parseInt(cartItem.quantity);
//                     cartItem.quantity += parseInt(operation);
//                     cartItem.quantity = Math.max(1, cartItem.quantity);

//                     // Calculate new subtotal
//                     // const newSubtotal = cartItem.quantity * product.offerPrice;

//                     await user.save();
//                     res.status(200).json({ message: "Quantity updated successfully", newQuantity: cartItem.quantity, newSubtotal: newSubtotal });
//                 } else {
//                     res.status(404).json({ error: "Product not found" });
//                 }
//             } else {
//                 res.status(404).json({ error: "Cart item not found" });
//             }
//         } else {
//             res.status(404).json({ error: "User not found" });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };



const about = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })

        res.render("about", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const contact = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })

        res.render("contact", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const changePasswordPage = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        res.render("changePassword", { category: category, userData: userData })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const changePassword = async (req, res) => {
    try {
        const oldPass = req.body.currentPassword
        const newPass = await securePassword(req.body.password)
        const category = await Category.find({ list: true })

        const userData = await Customer.findOne({ _id: req.body.userId })
        if (userData) {
            const passwordMatch = await bcrypt.compare(oldPass, userData.password)
            if (passwordMatch) {
                userData.password = newPass
                await userData.save()
                res.render("changePassword", { message1: "Password Changed Successfully!", user: req.body.userId, category: category, userData: userData })
            } else {
                res.render("changePassword", { message: "Current Password Not Matching", user: req.body.userId, category: category, userData: userData })
            }
        } else {
            res.send("user not found")
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const walletDetailsPage=async (req,res)=>{
    try {
        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const category = await Category.find({ list: true })
        const order=await Order.find({customerId:userData._id})
        const transactions=userData.transactionDetails
        const transaction = userData.transactionDetails.slice(skip, skip + limit);
        let totalCount=transactions.length
        let pageLimit=Math.ceil(totalCount/limit)
        const transactionTimestamp = new Date(transaction.transactionDate)
        const transactionsDate = transactionTimestamp.toLocaleDateString();
        res.render("walletDetails", { category: category, userData: userData,order:order,transaction:transaction ,transactionDate:transactionsDate,pageLimit,page:pageNumber})
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const couponDetailsPage=async (req,res)=>{
    try {
        const category= await Category.find({list:true})
        const userData= await Customer.findOne({_id:res.locals.user._id})
        const date=new Date()
        const coupon=await Coupon.find({ couponExpiry: { $gte: date },customers: {
            $not: {
                $elemMatch: {
                    customerId: userData._id,
                },
            },
        } })
        res.render("couponDetails",{userData,category,coupon})
    } catch (error) {
        console.log(error)
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


module.exports = {
    
    loadUserLogin,loadUserSignUp,insertUser,verifyUser,sendOtp, otp, verifyOtp,loginOtp,sendOtpLogin,verifyLoginOtp,forgotPasswordPage1, 
    forgotPassword1, forgotPasswordPage, forgotPassword, logout,
    accountDetailsPage, userProfileEditPage, userProfileEdit, verifyProfilePage, verifyProfile,userAddressPage, addAddressPage, addAddress,
    addAddressCheckout, editAddressPage, editAddressCheckoutPage, editAddress, editAddressCheckout, deleteAddress,about, contact,
    changePasswordPage, changePassword,walletDetailsPage,couponDetailsPage
}