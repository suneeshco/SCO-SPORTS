const userController=require("../controller/userController")
const productController=require("../controller/productController")
const cartController=require("../controller/cartController")
const orderController=require("../controller/orderController")


const session=require("express-session")

const express=require("express")
const userRoute=express()

userRoute.set("view engine","ejs")
userRoute.set("views","./view/userView")

require('dotenv').config();
const cookieparser = require('cookie-parser')
const validate = require('../middleware/userAuth');
userRoute.use(cookieparser())
const nocache = require('nocache')
userRoute.use(nocache())
userRoute.get('*',validate.checkUser)

 


// userRoute.use(session({
//     secret: 'your-secret-key',
//     resave: false,
//     saveUninitialized: true,
//   }));


  userRoute.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true
    })
);



//products related

userRoute.get("/userHome",validate.requireAuth,productController.userHome)
userRoute.get("/",validate.requireAuth1,productController.loadHome)
userRoute.get("/products/productsDetail",productController.productDetailPage)
userRoute.get("/products/category",productController.productByCategory)
userRoute.get("/search",productController.loadSearchItems)


//user related




//cart related

userRoute.get("/cart",validate.requireAuth,cartController.cartShowPage)
userRoute.post("/addToCart",cartController.addToCart)
userRoute.post("/updateCartQuantity",cartController.updateQuantity)
userRoute.get("/deleteCartItem/:id",validate.requireAuth,cartController.deleteCartItem)
userRoute.get("/clearCart/:id",cartController.clearCart)

userRoute.get("/wishlist",validate.requireAuth,cartController.wishlistPage)
userRoute.post("/addToWishlist",cartController.addToWishlist)
userRoute.get("/wishlistDelete/:id",cartController.deleteWishlistItem)




//order related

userRoute.get("/checkout",validate.requireAuth,orderController.checkoutPage)
userRoute.get("/orderSuccessful/:id",validate.requireAuth,orderController.orderSuccessfulPage)
userRoute.post("/placeOrder",orderController.placeOrder)
userRoute.post("/verifyPayment/:id",orderController.onlinePayment)
userRoute.post("/applyCoupon",orderController.applyCoupon)
userRoute.get("/userOrders",validate.requireAuth,orderController.orderDetailsPage)
userRoute.get("/orderDetails/:orderId",validate.requireAuth,orderController.orderDetails)
userRoute.get("/cancelOrder/:orderId",orderController.cancelOrder)
userRoute.post("/returnOrderConfirmation/:orderId",orderController.returnOrderApply)
userRoute.get("/cancelReturn/:orderId",orderController.cancelReturn)
userRoute.get("/download/invoice/:orderId",orderController.downloadInvoice)



userRoute.get("/user/login",validate.requireAuth1,userController.loadUserLogin)
userRoute.post("/user/login",userController.verifyUser)
userRoute.get("/user/signup",validate.requireAuth1,userController.loadUserSignUp)
userRoute.post("/user/signup",userController.insertUser)
userRoute.get("/sentOtp",validate.requireAuth1,userController.sendOtp)
userRoute.get("/otp",validate.requireAuth1,userController.otp)
userRoute.post("/otp",userController.verifyOtp)
userRoute.get("/loginOtp",validate.requireAuth1,userController.loginOtp)
userRoute.post("/send-otp",userController.sendOtpLogin)
userRoute.post("/loginOtp",userController.verifyLoginOtp)

userRoute.get("/forgotPassword1",validate.requireAuth1,userController.forgotPasswordPage1)
userRoute.post("/forgotPassword1",userController.forgotPassword1)
userRoute.get("/forgotPassword",validate.requireAuth1,userController.forgotPasswordPage)
userRoute.post("/forgotPassword",userController.forgotPassword)

userRoute.get("/logout",validate.requireAuth,userController.logout)
userRoute.get("/shop",productController.loadSearchItems)

userRoute.get("/userAccount",validate.requireAuth,userController.accountDetailsPage)
userRoute.get("/user/profile/edit",validate.requireAuth,userController.userProfileEditPage)
userRoute.post("/user/profile/edit",userController.userProfileEdit)
userRoute.get("/profileOtp",userController.verifyProfilePage)
userRoute.post("/profileOtp",userController.verifyProfile)
userRoute.get("/userAddress",validate.requireAuth,userController.userAddressPage)
userRoute.get("/addAddress",validate.requireAuth,userController.addAddressPage)
userRoute.post("/addAddress",userController.addAddress)
userRoute.post("/addAddressCheckout",userController.addAddressCheckout)
userRoute.get("/editAddress/:id",validate.requireAuth,userController.editAddressPage)
userRoute.post("/editAddress/:id",userController.editAddress)
userRoute.get("/editAddressCheckout/:id",validate.requireAuth,userController.editAddressCheckoutPage)
userRoute.post("/editAddressCheckout/:id",userController.editAddressCheckout)
userRoute.get("/deleteAddress/:id",validate.requireAuth,userController.deleteAddress)

userRoute.get("/about",userController.about)
userRoute.get("/contact",userController.contact)

userRoute.get("/changePassword",validate.requireAuth,userController.changePasswordPage)
userRoute.post("/changePassword",userController.changePassword)

userRoute.get("/walletDetails",userController.walletDetailsPage)
userRoute.get("/couponDetails",userController.couponDetailsPage)
// userRoute.get("/referrals",userController.referralPage)
// userRoute.get("*",async(req,res) => {res.render("errorPage",{statusCode:"404",errorMessage:"Page Not Found"})})





module.exports=userRoute