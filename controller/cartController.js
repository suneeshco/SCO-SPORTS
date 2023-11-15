const Customer = require("../model/customerModel")
const Category = require("../model/categoryModel")
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer")
const Product = require("../model/productModel")
const Brand = require("../model/adminBrand")
const Order = require("../model/orderModel")
const Coupon=require("../model/coupon")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const Razorpay = require('razorpay');
require('dotenv').config()


const cartShowPage = async (req, res) => {
    try {
        const customer = await Customer.findOne({ _id: res.locals.user._id });

        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id }).populate('cart.productId')
        const productData = userData.cart.map((item) => { return item.productId })
        let priceArray = []
        for (let i = 0; i < userData.cart.length; i++) {
            let subPrice = (userData.cart[i].quantity) * (productData[i].offerPrice)
            priceArray.push(subPrice)
        }


        let cartTotal = 0

        for (let i = 0; i < customer.cart.length; i++) {
            cartTotal = cartTotal + priceArray[i]
        }

        await customer.save()



        res.render("cart", { category: category, productData: productData, userData: userData, customer: customer, priceArray: priceArray, cartTotal: cartTotal })

    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const addToCart = async (req, res) => {
    try {

        const productId = req.body.productId
        const product = await Product.findById(productId);
        const size = req.body.size
        const userId = req.body.userId
        const cartItem = {
            productId: productId,
            quantity: 1,
            size: size,
            subtotal: product.offerPrice
        };

        const user = await Customer.findById(userId);


        if (user) {
            const existingCartItem = user.cart.find((item) => (item.productId.toString() === productId) && (item.size.toString() === size));
            console.log(existingCartItem);
            if (existingCartItem) {
                existingCartItem.quantity += 1;
                existingCartItem.subtotal += product.offerPrice;
            } else {
                user.cart.push(cartItem);
            }
            await user.save();
            res.redirect("/cart");
        } else {
            return res.status(404).render("errorPage",{statusCode:"404",errorMessage:"User Not Found"})
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};




const updateQuantity = async (req, res) => {
    try {
        const { userId, cartId, productId, count } = req.body;

        const customer = await Customer.findById(userId);
        const cartItem = customer.cart.id(cartId);
        const products = await Product.findById(productId)
        const offerPrice = parseInt(products.offerPrice)

        if (cartItem) {
            let quant = Math.max(1, cartItem.quantity + count)
            if (quant > products.stock) {
                return res.json({ error: 'No more stock available' })

            } else {
                cartItem.quantity = quant
                cartItem.subtotal = cartItem.quantity * offerPrice
                await customer.save()
            }


        } else {
            return res.status(404).render("errorPage",{statusCode:"404",errorMessage:"CartItem Not Found"})
        }
        customer.cartTotal = 0

        for (let i = 0; i < customer.cart.length; i++) {
            customer.cartTotal = customer.cartTotal + customer.cart[i].subtotal
        }

        await customer.save()
        console.log(customer.cartTotal);
        res.json({ message: 'Cart quantity updated successfully', updatedQuantity: cartItem.quantity, productValue: cartItem.subtotal, cartTotal: customer.cartTotal });
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const deleteCartItem = async (req, res) => {
    try {
        const id = req.params.id

        const success = await Customer.updateOne({ _id: res.locals.user._id }, {
            $pull: { cart: { _id: id } }
        })
        if (success) {
            res.redirect("/cart")
        }
        else {
            return res.status(404).render("errorPage",{statusCode:"404",errorMessage:"Something Wrong With Deletion"})
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const clearCart = async (req, res) => {
    try {
        const id = req.params.id

        const success = await Customer.updateMany({ _id: id }, { $set: { cart: [] } });

        if (success) {
            res.redirect("/cart")
        }
        else {
            return res.status(404).render("errorPage",{statusCode:"404",errorMessage:"Something Wrong With Deletion"})
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const wishlistPage = async (req, res) => {
    try {
        const category = await Category.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id }).populate('wishlist.productId')
        const productData = userData.wishlist.map((item) => { return item.productId })
        console.log(productData);

        res.render("wishlist", { category: category, productData: productData, userData: userData })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const addToWishlist = async (req, res) => {
    try {
        const { productId, userId, size } = req.body
        const product = await Product.findById(productId)
        const wish = {
            productId: productId,
            size: size

        }

        const user = await Customer.findOne({ _id: userId })

        if (user) {
            const existingCartItem = user.wishlist.find((item) => item.productId.toString() === productId);
            if (!existingCartItem) {
                user.wishlist.push(wish)
                await user.save()
                res.json({added:"Item added",count:user.wishlist.length})

            }else{
                res.json({exist:"exist"})
            }

        } else {
            return res.status("404").json({ error: "No user found" })
        }

    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const deleteWishlistItem = async (req, res) => {
    try {
        const id = req.params.id

        const success = await Customer.updateOne({ _id: res.locals.user._id }, {
            $pull: { wishlist: { _id: id } }
        })
        if (success) {
            res.redirect("/wishlist")
        }
        else {
            return res.status(404).render("errorPage",{statusCode:"404",errorMessage:"Something Wrong With Deletion"})
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const addToCartFromWishlist=async (req,res)=>{
    try {
        const  productId  = req.body.productId
console.log(productId,"56565656565")
        const userId = req.body.userId;
        if (!productId) {
          return res.status(400).json({ error: "Product ID is required" });
        }
        
        const user = await Customer.findById(userId);
    
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
    
        const size = product.size
        if (user) {
          const existingCartItem = user.cart.find(
            (item) => item.productId.toString() === productId.toString());
    
          if (existingCartItem) {
            // If it exists, increase the quantity
            existingCartItem.quantity += 1;
            existingCartItem.subtotal += product.offerPrice;
          } else {
            // If it doesn't exist, add a new item to the cart
            user.cart.push({
              productId: productId,
              quantity: 1,
              size: size,
              subtotal: product.offerPrice,
            });
          }
    
          user.wishlist.pull({ productId: productId });
          await user.save();
    
          console.log(
            "Product added to cart successfully and removed from wishlist"
          );
          res.redirect("/wishlist");
        } else {
          res.redirect("/login");
        }  
    } catch (error) {
        console.log(error)
        res.status(500).render("errorPage",{statusCode:"500",errorMessage:"Internal Server Error"})
    }
}



module.exports={cartShowPage,addToCart,updateQuantity,deleteCartItem,clearCart,wishlistPage,addToWishlist,
    deleteWishlistItem,addToCartFromWishlist}