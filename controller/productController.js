const Customer = require("../model/customerModel")
const Category = require("../model/categoryModel")
// const bcrypt = require("bcrypt");
// const nodemailer = require("nodemailer")
const Product = require("../model/productModel")
const Brand = require("../model/adminBrand")
const Banner=require("../model/bannerModel")
// const Order = require("../model/orderModel")
// const Coupon=require("../model/coupon")
// const jwt = require("jsonwebtoken")
// const mongoose = require("mongoose")
// const Razorpay = require('razorpay');
require('dotenv').config()


//user Side

const userHome = async (req, res) => {
    try {
        const banner=await Banner.find({status:true})
        const category = await Category.find({ list: true })
        const homeData = await Product.find({ list: true }).populate('category')
        const brand = await Brand.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        res.render("userHome", { homeData: homeData, category: category, brand: brand,userData:userData, userId: res.locals.user._id,banner })
    } catch (error) {
        console.log(error);
        
        let statusCode = 500; 

        if (error.name === 'CastError' || error.name === 'ValidationError') {
            statusCode = 400; 
        }
        res.status(statusCode).render('errorPage', {statusCode:statusCode,errorMessage: error.message });

    }
}

const loadHome = async (req, res) => {
    try {
        const homeData = await Product.find({ list: true })
        const category = await Category.find({ list: true })
        res.render("loadHome", { homeData: homeData, category: category })
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
}


const productDetailPage = async (req, res) => {
    try {
        const id = req.query.id
       
    
        const data = await Product.findOne({ _id: id }).populate('category')
        const category = await Category.find({ list: true })
        const homeData = await Product.find({ list: true }).populate('category')
        const userId = res.locals.user._id
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        console.log(userData);
        if (!data) {
            const errorMessage = "The product you are looking for does not exist.";
            const statusCode = 404

            return res.status(statusCode).render('errorPage', { statusCode, errorMessage });
        }
       

        res.render("productDetails", { data: data, category: category, homeData: homeData, userId: userId, userData: userData })
    } catch (error) {
        console.log(error);
        let statusCode = 500;
        let errorMessage = "Internal Server Error";

        if (error.name === 'CastError' || error.name === 'ValidationError') {
            statusCode = 400;
            errorMessage = "Invalid data provided. Please check your input.";
        }

        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const shopAll = async (req, res) => {
    try {
let searchQuery=""
let categ=""
let pages=req.query.pages
        const category = await Category.find({ list: true })
        // const homeData = await Product.find({ list: true })
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        

        const limit=2
        const pageNumber = pages ? parseInt(pages, 9) : 1;
       const skipCount = (pageNumber - 1) * limit;
       const data=await Product.find()
       const searchResults =  await Product.find().skip(skipCount).limit(limit).populate('category')
       console.log(searchResults);

        let page=Math.ceil(data.length/limit)
        console.log(page);
        res.render("shopAll", { category: category, homeData: searchResults, userData: userData,page:page,searchQuery:searchQuery,categ:categ,pages:pages })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const productByCategory = async (req, res) => {
    try {
        const categoryName = req.query.category
        const category = await Category.find({ list: true })
        const homeData = await Product.find({ list: true, category: categoryName })
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const user = res.locals.user._id
        const limit=9
        let page=Math.ceil(homeData.length/limit)
        res.render("shopAll", { category: category, homeData: homeData, user: user, userData: userData ,page: page})
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";

        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const loadSearchItems = async (req, res) => {
    try {
        const searchQuery = req.query.query;
        const pages=req.query.pages
        const categ=req.query.categ
        const sort=req.query.sort
        console.log('Received search query:', searchQuery);
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const productDetail=await Product.find({list:true})
        const categoryIdsWithProducts = new Set(productDetail.map(product => product.category));
        const category = await Category.find({ _id: { $in: [...categoryIdsWithProducts] }, list: true });
        
        let filter={list:true}

        // Use Mongoose's $text operator for text search
    //    const searchResults =  await Product.find({ $or: [
    //     { title: { $regex: new RegExp(searchQuery, 'i') } },
    //     { category: { $regex: new RegExp(searchQuery, 'i') } },
    //     { brand: { $regex: new RegExp(searchQuery, 'i') } }
    //   ]});

    

      if(searchQuery){
        filter.title = { $regex: new RegExp(searchQuery, 'i') }

      }
      if(categ){
        filter.category=categ
      }
      
      
      const limit=6
      const pageNumber = pages ? parseInt(pages) : 1;
     const skipCount = (pageNumber - 1) * limit;
     const results=await Product.find(filter)
     const searchResults =  await Product.find(filter).populate('category').sort({offerPrice:sort}).skip(skipCount).limit(limit)

        console.log(searchResults);
        
        const page=Math.ceil(results.length/limit)
        res.render("shopAll",{category:category,userData:userData,homeData:searchResults,page:page,searchQuery:searchQuery,categ:categ,pages:pages,sort:sort})
    } catch (error) {
        console.error('Search error:', error);
        const statusCode = 500;
        const errorMessage = 'An error occurred during the search. Please try again later.';
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}









//ADMIN SIDE











module.exports={userHome,loadHome,productDetailPage,shopAll,productByCategory,loadSearchItems}