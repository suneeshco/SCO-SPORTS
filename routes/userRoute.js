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

userRoute.get("/userHome",productController.userHome)
userRoute.get("/",productController.userHome)
userRoute.get("/products/productsDetail",productController.productDetailPage)
userRoute.get("/products/category",productController.productByCategory)
userRoute.get("/search",productController.loadSearchItems)
userRoute.get("/shop",productController.loadSearchItems)


//user related

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

userRoute.get("/userAccount",validate.isBlocked,validate.requireAuth,userController.accountDetailsPage)
userRoute.get("/user/profile/edit",validate.isBlocked,validate.requireAuth,userController.userProfileEditPage)
userRoute.post("/user/profile/edit",userController.userProfileEdit)
userRoute.get("/profileOtp",validate.isBlocked,userController.verifyProfilePage)
userRoute.post("/profileOtp",userController.verifyProfile)
userRoute.get("/userAddress",validate.isBlocked,validate.requireAuth,userController.userAddressPage)
userRoute.get("/addAddress",validate.isBlocked,validate.requireAuth,userController.addAddressPage)
userRoute.post("/addAddress",userController.addAddress)
userRoute.post("/addAddressCheckout",userController.addAddressCheckout)
userRoute.get("/editAddress/:id",validate.isBlocked,validate.requireAuth,userController.editAddressPage)
userRoute.post("/editAddress/:id",userController.editAddress)
userRoute.get("/editAddressCheckout/:id",validate.isBlocked,validate.requireAuth,userController.editAddressCheckoutPage)
userRoute.post("/editAddressCheckout/:id",userController.editAddressCheckout)
userRoute.get("/deleteAddress/:id",validate.isBlocked,validate.requireAuth,userController.deleteAddress)

userRoute.get("/about",userController.about)
userRoute.get("/contact",userController.contact)

userRoute.get("/changePassword",validate.isBlocked,validate.requireAuth,userController.changePasswordPage)
userRoute.post("/changePassword",userController.changePassword)

userRoute.get("/walletDetails",validate.isBlocked,validate.requireAuth,userController.walletDetailsPage)
userRoute.get("/couponDetails",validate.isBlocked,validate.requireAuth,userController.couponDetailsPage)


//cart related

userRoute.get("/cart",validate.isBlocked,validate.requireAuth,cartController.cartShowPage)
userRoute.post("/addToCart",cartController.addToCart)
userRoute.post("/updateCartQuantity",cartController.updateQuantity)
userRoute.get("/deleteCartItem/:id",validate.isBlocked,validate.requireAuth,cartController.deleteCartItem)
userRoute.get("/clearCart/:id",validate.isBlocked,validate.requireAuth,cartController.clearCart)

userRoute.get("/wishlist",validate.isBlocked,validate.requireAuth,cartController.wishlistPage)
userRoute.post("/addToWishlist",cartController.addToWishlist)
userRoute.get("/wishlistDelete/:id",validate.isBlocked,validate.requireAuth,cartController.deleteWishlistItem)
userRoute.post("/addToCartFromWishlist",cartController.addToCartFromWishlist)




//order related

userRoute.get("/checkout",validate.isBlocked,validate.requireAuth,orderController.checkoutPage)
userRoute.get("/orderSuccessful/:id",validate.isBlocked,validate.requireAuth,orderController.orderSuccessfulPage)
userRoute.post("/placeOrder",orderController.placeOrder)
userRoute.post("/verifyPayment/:id",orderController.onlinePayment)
userRoute.post("/applyCoupon",orderController.applyCoupon)
userRoute.get("/userOrders",validate.isBlocked,validate.requireAuth,orderController.orderDetailsPage)
userRoute.get("/orderDetails/:orderId",validate.isBlocked,validate.requireAuth,orderController.orderDetails)
userRoute.get("/cancelOrder/:orderId",validate.isBlocked,validate.requireAuth,orderController.cancelOrder)
userRoute.post("/returnOrderConfirmation/:orderId",orderController.returnOrderApply)
userRoute.get("/cancelReturn/:orderId",validate.isBlocked,validate.requireAuth,orderController.cancelReturn)
userRoute.get("/downloads/invoice/:orderId",validate.isBlocked,validate.requireAuth,orderController.downloadInvoice)







// userRoute.get("/referrals",userController.referralPage)
// userRoute.get("*",async(req,res) => {res.render("errorPage",{statusCode:"404",errorMessage:"Page Not Found"})})





module.exports=userRoute