const Admin = require("../model/adminModel")
const Category = require("../model/categoryModel")
const Brand = require("../model/adminBrand")
const bcrypt = require("bcrypt");
const Product = require("../model/productModel")
const Customer = require("../model/customerModel")
const Order = require("../model/orderModel")
const Coupon= require("../model/coupon")
const Banner= require("../model/bannerModel")
const nodemailer = require("nodemailer")
const jwt=require("jsonwebtoken")
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const fs = require('fs');
const path=require("path")
const sharp=require("sharp")
require('dotenv').config()

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.ADMIN_JWT_SECRETKEY, {
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
        throw { statusCode: 500, message: "Internal Server Error" };
    }
}




//**************************************************************************************************
//Admin Login Related
//**************************************************************************************************







const loadAdminLogin = async (req, res) => {
    try {
        res.render("adminLoginPage")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const verifyAdmin = async (req, res) => {
    try {
        const email = req.body.adminName;
        const password = req.body.adminPassword;
        const adminData = await Admin.findOne({ email: email })
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if (passwordMatch) {
                if (adminData.is_admin) {
                    const token = createToken(adminData._id);
                    res.cookie('jwtAdmin', token, { httpOnly: true, maxAge: maxAge * 1000 });
                    res.redirect("/admin/dashboard");
                } else {
                    return res.render("adminLoginPage", { message: "You are not an Admin" })
                }
            } else {
                return res.render("adminLoginPage", { message: "Invalid Password" })
            }
        } else {
            return res.render("adminLoginPage", { message: "Invalid Username" })
        }
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
}

const loadAdminHome = async (req, res) => {
    try {
        const orders=await Order.find()
        const products=await Product.find({list:true})
        const category=await Category.find({list:true})
        res.render("adminDashboard",{orders:orders,products,category})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const adminLogout = async (req, res) => {
    try {
        await  res.cookie('jwtAdmin','',{maxAge:1})
        res.redirect("/admin")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const forgetPage1 = async (req, res) => {
    try {
        res.render("adminForgot1")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });   
     }
}


var adminForgetOtp, adminForgetMail
const forget1 = async (req, res) => {
    try {
        const email = req.body.adminName;
        const user = await Admin.findOne({ email: email })
        if (user) {
            adminForgetMail = email
            let otpCode = Math.floor(1000 + Math.random() * 9000).toString();
            adminForgetOtp = otpCode


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
                    res.redirect("/admin/forgetPassword")

                }
            });
        } else {
            res.render("adminForgot1", { message: "You are not a User.Create New Account!" })
        }

    } catch (error) {
        console.error("Error: ", error);
        return res.status(500).json({ message: "Failed to send OTP email" });

    }
}


const forgetPage = async (req, res) => {
    try {
        res.render("adminForget")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });    }
}


const forget = async (req, res) => {
    try {
        if (req.body.otp === adminForgetOtp) {
            if (req.body.newPassword === req.body.confirmPassword) {
                const sPassword = await securePassword(req.body.newPassword)
                const forgot = await Admin.updateOne({ email: adminForgetMail }, { $set: { password: sPassword } })
                if(forgot){
                    res.redirect("/admin")
                }
               

            } else {
                res.render("adminForget", { message: "Password mismatching" })
            }
        } else {
            res.render("adminForget", { message: "Wrong OTP" })
        }


    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });

    }
}





//**************************************************************************************************
//Category related
//**************************************************************************************************







const categoryPage = async (req, res) => {
    
    try {
        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const categoryLists = await Category.find({})
        const categoryList = await Category.find({}).skip(skip).limit(limit)
        let pageLimit=Math.ceil(categoryLists.length/limit)
        res.render("category", { categoryList: categoryList,page,pageLimit })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const addCategory = async (req, res) => {
    try {
        const newCategory = req.body.categoryName.trim().toUpperCase(); // Correctly matches the input field name
        const discount= req.body.categoryDiscount
        const checkName = await Category.findOne({ categoryName: newCategory })
        const categoryList = await Category.find({})
        if (checkName) {
            res.render("category", { message: "Already have a category with this name",categoryList:categoryList })
        }
        else {
            const category = new Category({
                categoryName: newCategory,
                list: 1,
                discount:discount
            })
            const addSuccess = await category.save()
            if (addSuccess) {
                res.redirect("/admin/category?page=1")
            }
            else {
                res.render("category", { message: "Something Went Wrong" })
            }
        }
        
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id
        await Category.deleteOne({ _id: id })
        res.redirect("/admin/category?page=1")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const editCategoryPage = async (req, res) => {
    try {
        const id = req.query.id
        const data = await Category.findOne({ _id: id })
        res.render("editCategory", { categoryData: data })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const editCategory = async (req, res) => {
    try {
        const categoryName = req.body.categoryName.toUpperCase()
        const discount=req.body.categoryDiscount
        const maxDiscount=req.body.maxDiscount
        const status = req.body.status[0] === 'true'
        const categoryData = await Category.findById(req.body.categoryId);
        
        
        if (categoryData) {
            const checkData = await Category.findOne({ categoryName: categoryName, _id: { $ne: req.body.categoryId } });
            if (checkData) {
                res.render("editCategory", { message: "category name already exists", categoryData: categoryData })
            }
            else {
                
                // const userData =
                 await Category.findByIdAndUpdate({ _id: req.body.categoryId }, { $set: { categoryName: categoryName, list: status ,discount:discount,maxDiscount:maxDiscount} });

                const products=await Product.find({category:req.body.categoryId})
                
                    for(let i=0;i<products.length;i++){
                        let disc=Math.ceil(products[i].offerPrice*(discount/100))
                        if(disc>maxDiscount){
                            disc=maxDiscount
                        }
                        products[i].offerPrice=products[i].offerPrice-disc
                        await products[i].save()
                    }
                    


                res.redirect('/admin/category?page=1');
            }
        }
        // const id=req.body.categoryId


    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}









//**************************************************************************************************
//Products Related
//**************************************************************************************************






const addProductPage = async (req, res) => {
    try {
        const brand = await Brand.find({ list: true })
        const category = await Category.find({ list: true })

        res.render("addProduct", { brand: brand, category: category })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const productShowPage = async (req, res) => {
    try {

        let limit=10
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const products = await Product.find({ list: true })
        const product=await Product.find({list:true}).skip(skip).limit(limit)
        const category=await Category.find({list:true})
        let pageLimit=Math.ceil(products.length/limit)
        res.render("productShow", { product: product,category:category,pageLimit,page })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const addProduct = async (req, res) => {
    try {

        const images = req.files.map(file => {
            return { url: file.filename };
        });

        let regularPrice=req.body.regularPrice
        let productDiscount=req.body.productDiscount
        let offerPrice
        if(productDiscount>0){
            offerPrice=Math.ceil(regularPrice-(regularPrice*(productDiscount/100)))
        }else{
            offerPrice=regularPrice
        }
        

        const newProduct = new Product({
            title: req.body.product_name,
            description: req.body.description,
            regularPrice: regularPrice,
            offerPrice: offerPrice,
            size: req.body.size,
            stock: req.body.stock,
            productDiscount:productDiscount,
            brand: req.body.brandSelect,
            category: req.body.categorySelect,
            images: [],
            list: 1,
            createdOn: new Date(),
            updatedOn: new Date()
        });

        for (let file of req.files) {
            
            const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = "public/admin-assets/imgs/croppedProducts/"
            console.log(imageDirectory)
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            const croppedImage = await sharp(file.path)
                .resize(1000, 1000, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                let imgObj={
                    url:imgFileName
                }
                newProduct.images.push(imgObj)
            }
        }

        // Save the product to the database
        const result=await newProduct.save()

        if (result) {
            res.redirect("/admin/products?page=1")
        } else {
            const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });

        }


    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const editProductPage = async (req, res) => {
    try {
        const id = req.params.productId
        const data = await Product.findOne({ _id: id })
        const brand = await Brand.find({ list: true })
        const category = await Category.find({ list: true })
        res.render("editProduct", { brand: brand, category: category, data: data })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const editProduct = async (req, res) => {
    try {
        // const images = req.files.map(file => {
        //     return { url: file.filename }
        // });
        let images=[]

        let regularPrice=req.body.regularPrice
        let productDiscount=req.body.productDiscount
        let offerPrice
        if(productDiscount>0){
            offerPrice=Math.ceil(regularPrice-(regularPrice*(productDiscount/100)))
        }else{
            offerPrice=regularPrice
        }

        const productId = req.body.productId;
        const file = await Product.findOne({ _id: productId })
        for (let file of req.files) {
            
            const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = "public/admin-assets/imgs/croppedProducts/"
            console.log(imageDirectory)
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            const croppedImage = await sharp(file.path)
                .resize(1000, 1000, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                let imgObj={
                    url:imgFileName
                }
                images.push(imgObj)
            }
        }

        const userData = await Product.findByIdAndUpdate(
            { _id: productId },
            {
                $set: {
                    title: req.body.product_name,
                    description: req.body.description,
                    regularPrice: regularPrice,
                    offerPrice: offerPrice,
                    size: req.body.size,
                    stock: req.body.stock,
                    productDiscount:productDiscount,
                    brand: req.body.brandSelect,
                    category: req.body.categorySelect,
                    images: [...file.images,...images],
                    updatedOn: new Date()
                }
            }
            
        );
        res.redirect('/admin/products?page=1');
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await Product.findByIdAndUpdate({ _id: id }, { $set: { list: false } });
        res.redirect("/admin/products")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const deletedProductsPage = async (req, res) => {
    try {
        const product = await Product.find({ list: false })
        const category=await Category.find({list:true})
        res.render("deletedProducts", { product: product ,category:category})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const addFromDelete = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await Product.findByIdAndUpdate({ _id: id }, { $set: { list: true } });
        res.redirect("/admin/products/deletedProducts")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




// const deleteImage = async (req, res) => {
//     try {
//         const id = req.query.id
//         const product = await Product.findOne({ "images._id": id });
//         Product.images = product.images.filter(image => image._id.toString() !== id);
//         await product.save();
//         res.redirect(`/admin/products/edit?id=${product._id}`);
//     } catch (error) {
//         console.log(error);
//     }
// }




const deleteImage = async (req, res) => {
    const category = await Category.find({});
    const brands = await Brand.find({});
    

    try {
        const imgId = req.params.imgId;
        const product = await Product.findOne({ "images._id": imgId });
        console.log(imgId);
        if (!product) {
             const statusCode = 404;
            const errorMessage = "Image not found";
            return res.status(statusCode).render('errorPage', { statusCode, errorMessage });
        }
        product.images = product.images.filter(image => image._id.toString() !== imgId);
        await product.save();
        res.redirect(`/admin/products/edit/${product._id}`);
    } catch (error) {
        console.log(error.message);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};










//**************************************************************************************************
//User Related
//**************************************************************************************************



const usersShowPage = async (req, res) => {
    try {
        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const users = await Customer.find({})
        const user = await Customer.find({}).skip(skip).limit(limit)
        let pageLimit=Math.ceil(users.length/limit)
        res.render("userList", { user: user,page,pageLimit })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const usersStatusBlock = async (req, res) => {
    try {


        const users = await Customer.findByIdAndUpdate({ _id: req.query.id }, { $set: { status: false } })
        res.redirect("/admin/users?page=1")

    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const usersStatusUnblock = async (req, res) => {
    try {


        const users = await Customer.findByIdAndUpdate({ _id: req.query.id }, { $set: { status: true } })
        res.redirect("/admin/users?page=1")

    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




//**************************************************************************************************
//Brand Related
//**************************************************************************************************






const brandsShowPage = async (req, res) => {
    try {

        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const brandDatas = await Brand.find({})
        let pageLimit=Math.ceil(brandDatas.length/limit)
        const brandData = await Brand.find({}).skip(skip).limit(limit)
        res.render("brands", { brandData: brandData,page,pageLimit })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const addBrandPage = async (req, res) => {
    try {
        res.render("addNewBrand")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


// const addBrand = async (req, res) => {
//     try {
//         const newBrand = req.body.brandName;
//         // Correctly matches the input field name
//         console.log("newBrand ",newBrand);
//         const checkName = await Brand.findOne({ brandName: newBrand })
//         if (checkName) {
//             res.render("addNewBrand", { message: "Already have a category with this name" })
//         }
//         else {
//             const brand = new Brand({
//                 brandName: newBrand,
//                 brandDescription: req.body.brandDescription,
//                 list: req.body.status,
//                 image:req.file.filename
//             })
//             const addSuccess =await brand.save()
//             if (addSuccess) {
//                 res.redirect("brands")
//             }
//             else {
//                 res.render("addNewBrand", { message: "Something Went Wrong" })
//             }
//         }
//     } catch (error) {
//         console.log(error);
//     }
// }


const addBrand = async (req, res) => {
    try {
        const newbrand = req.body.brand_name;
        const Discription = req.body.brand_description; // Make sure the field name matches your form
        const Imagefile = req.file.filename;
        const brandData= await Brand.find({})



        const brandExists = await Brand.findOne({ brandName: newbrand });
        if (brandExists) {
            return res.render("addNewBrand", { message: "Hey Admin, This brand already exists.",brandData:brandData });
        }

        if (!newbrand) {
            return res.render("addNewBrand", { message: "Hey Admin , Brand name is required.",brandData:brandData });
        }

        if (!Discription) {
            return res.render("addNewBrand", { message: "Hey Admin, Brand description is required.",brandData:brandData });
        }

        if (!Imagefile) {
            return res.render("addNewBrand", { message: "Hey Admin , Image is required.",brandData:brandData });
        }

        const brandd = new Brand({
            brandName: newbrand,
            brandDescription: Discription,
            list: 1,
            image: Imagefile
        });

        const addSuccess = await brandd.save();
        if (addSuccess) {
            res.redirect("/admin/brands")
        } else {
            console.log("Error saving brand to the database.");
            res.render("brands", { message: "Something went wrong",brandData:brandData });
        }
    } catch (error) {
        console.log("Error in addBrand function:", error.message);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};


const brandsEditPage = async (req, res) => {
    try {
        const id = req.query.id
        const data = await Brand.findOne({ _id: id })
        res.render("editBrand", { brandData: data })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const brandsEdit = async (req, res) => {
    try {
        const newbrand = req.body.brand_name;
        const discription = req.body.brand_description; // Make sure the field name matches your form

        const data = await Brand.findOne({ _id: req.body.brandId })
        const list = req.body.status

        if (data) {
            const checkData = await Brand.findOne({ brandName: newbrand, _id: { $ne: req.body.brandId } });
            if (checkData) {
                res.render("editBranded", { message: "brand name already exists", brandData: data })
            }
            else {
                let image = data.image
                if (req.file) {
                    image = req.file.filename
                }

                const brand = await Brand.findByIdAndUpdate({ _id: req.body.brandId }, { $set: { brandName: newbrand, brandDescription: discription, list: list, image: image } })
                res.redirect("/admin/brands")
            }
        }


    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const deleteBrand = async (req, res) => {
    try {
        const id = req.query.id
        const deleted = await Brand.deleteOne({ _id: id })
        res.redirect("/admin/brands")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



// const brandImageDelete=async (req,res)=>{
//     try {
//         const brandId=req.params.brandId
//         // const image=
//         const img=await Brand.update({_id:brandId},{$set:{}})
//     } catch (error) {
//         console.log(error);
//     }
// }





//**************************************************************************************************
//Order Related
//**************************************************************************************************


const orderDetailsPage=async (req,res)=>{
    try {

        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const orders=await Order.find({})
        const order=await Order.find({}).sort({createdOn:-1}).skip(skip).limit(limit)
        let pageLimit=Math.ceil(orders.length/limit)
        res.render("orderManagement",{order:order,page,pageLimit})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const editOrderPage=async (req,res)=>{
    try {
        const orderId=req.params.orderId
            
            const order = await Order.findById(orderId)
            const addressData = order.address
            const orderDetails=await Order.findOne({_id:orderId}).populate('items.productId')
            const productData= orderDetails.items.map((item)=>{return item.productId})
            const deliveredOnTimestamp = new Date(order.deliveredOn); // Replace with your timestamp
            const orderedOnTimestamp = new Date(order.createdOn);

            // Extract the date and format it as a string
            const deliveryDate = deliveredOnTimestamp.toLocaleDateString();
            const orderedDate = orderedOnTimestamp.toLocaleDateString()
            console.log(orderDetails);
        res.render("orderDetails",{addressData:addressData,order:order,productData:productData,items:orderDetails.items,deliveryDate:deliveryDate,orderedDate:orderedDate})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const updateOrder=async (req,res)=>{
    try {
        const orderId=req.body.orderId
        const status=req.body.orderStatus
        const update= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}})
        const orderDetail=await Order.findOne({_id:orderId})
        const customer=await Customer.findOne({_id:orderDetail.customerId})
        if(status==="delivered"){
            const deliveryUpdate= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status,deliveredOn:new Date(),deliveryStatus:true}})
            if(!customer.referralPurchase){
                customer.referralPurchase=true

                const userRef=await Customer.findOne({referralCode:customer.usedReferral})
                if(userRef){
                    userRef.wallet=parseInt(userRef.wallet+300)
                    userRef.transactionDetails.push({transactionType:"referral",transactionAmount:300,transactionDate:new Date()})
                    await userRef.save()
                    customer.wallet=200
                    customer.transactionDetails.push({transactionType:"referral",transactionAmount:200,transactionDate:new Date()})
                    await customer.save()
                }
            }
        }

        if(status==="Cancelled"){

            if(orderDetail.paymentMethod=="Online Payment"){
                if(orderDetail.returnReason=="Damaged or Defective Product"){
                    const cancel= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}})
                }else{
                    const cancel= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}})
                    if(cancel){
                        for(let i=0;i<orderDetail.items.length;i++){
                        let product=await Product.findOne({_id:orderDetail.items[i].productId})
                        product.stock=product.stock+orderDetail.items[i].quantity
                        await product.save()
                        }
                        
                    }
                }
    
                
                customer.wallet=(customer.wallet+orderDetail.totalAmount)??orderDetail.totalAmount
                    customer.transactionDetails.unshift({
                        transactionType:"credit",
                        transactionAmount:orderDetail.totalAmount,
                        transactionDate:new Date(),
                        orderId:orderDetail._id
                    })
                    await customer.save()
            }else{
                if(orderDetail.returnReason=="Damaged or Defective Product"){
                    const cancel= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}})
                }else{
                    const cancel= await Order.findByIdAndUpdate({_id:orderId},{$set:{status:status}})
                    if(cancel){
                        for(let i=0;i<orderDetail.items.length;i++){
                        let product=await Product.findOne({_id:orderDetail.items[i].productId})
                        product.stock=product.stock+orderDetail.items[i].quantity
                        await product.save()
                        }
                        
                    }
                }
            }
 
        }
        res.redirect("/admin/orders?page=1")
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const approveReturn=async (req,res)=>{
    try {
        const customer=await Customer.findOne({_id:req.query.userId})
        
        const orderId=req.query.orderId
        const order=await Order.findOne({_id:orderId})
        const orderDetail=await Order.findOne({_id:orderId})
        if(order.returnReason=="Damaged or Defective Product"){

        }else{
            const orderDetail=await Order.findOne({_id:orderId})
            
                for(let i=0;i<orderDetail.items.length;i++){
                let product=await Product.findOne({_id:orderDetail.items[i].productId})
                product.stock=product.stock+orderDetail.items[i].quantity
                await product.save()
                }
                
            
        }
        const edit = await Order.updateOne({_id:orderId},{$set:{return:false,returnStatus:"return approved",status:"returned"}})
        if(edit){
            customer.wallet=(customer.wallet+orderDetail.totalAmount)??orderDetail.totalAmount
                customer.transactionDetails.unshift({
                    transactionType:"credit",
                    transactionAmount:orderDetail.totalAmount,
                    transactionDate:new Date(),
                    orderId:orderDetail._id
                })
                await customer.save()
            res.redirect("/admin/orders?page=1")
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const rejectReturn=async (req,res)=>{
    try {
        const orderId=req.params.orderId
        const edit = await Order.updateOne({_id:orderId},{$set:{return:false,returnStatus:"return rejected"}})
        if(edit){
            res.redirect("/admin/orders?page=1")
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}







//**************************************************************************************************
//Coupon Related
//**************************************************************************************************

const couponManagementPage=async (req,res)=>{
    try {

        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const couponsDetails=await Coupon.find({})
        const couponDetails=await Coupon.find({}).skip(skip).limit(limit)
        let pageLimit=Math.ceil(couponsDetails.length/limit)

        res.render("couponManagement",{couponDetails:couponDetails,page,pageLimit})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const editCouponPage=async (req,res)=>{
    try {
        const couponId=req.params.couponId
        const couponDetails=await Coupon.findOne({_id:couponId})
        res.render("editCoupon",{couponDetails:couponDetails})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const addCoupon=async (req,res)=>{
    try {
        const couponCode=req.body.couponCode
        const coupons=await Coupon.findOne({couponCode:couponCode})
        const couponDetails=await Coupon.find({})
        
        if(coupons){
            res.render("couponManagement",{couponDetails:couponDetails,message:"Coupon Already Exist"})
        }else{
            const coupon = new Coupon({
                couponCode:couponCode,
                couponDescription:req.body.couponDescription,
                couponDiscount:req.body.couponDiscount,
                couponExpiry:req.body.couponExpiry,
                maximumAmount:req.body.maximumAmount,
                minimumAmount:req.body.minimumAmount,
                createdOn:new Date()
            })
            const coup=await coupon.save()
            console.log(coup.couponExpiry);
            if(coup){
                res.redirect("/admin/coupons?page=1")
            }
        }
        
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const editCoupon=async (req,res)=>{
    try {
        const coup= await Coupon.updateMany({_id:req.body.couponId},{$set:{
            couponCode:req.body.couponCode,
            couponDescription:req.body.couponDescription,
            couponDiscount:req.body.couponDiscount,
            couponExpiry:req.body.couponExpiry,
            maximumAmount:req.body.maximumAmount,
            minimumAmount:req.body.minimumAmount}})
            if(coup){
                res.redirect("/admin/coupons?page=1")
            }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const deleteCoupon=async (req,res)=>{
    try {
        const id=req.query.id
         let deleted=await Coupon.deleteOne({_id:id})
        if(deleted){
            console.log("not deleted");
            res.redirect("/admin/coupons?page=1")
        }
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const fetchDataGraph = async (req, res) => {
    try {
        const time = req.params.time;
        if (time === 'month') {
            const currentYear = new Date().getFullYear();
            const data = await Order.aggregate([
                {
                    $match: {
                        createdOn: {
                            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                            $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$createdOn' }, 
                        ordersCount: { $sum: 1 } 
                    }
                }
            ]);

            const allMonths = {
                'January': 0,
                'February': 0,
                'March': 0,
                'April': 0,
                'May': 0,
                'June': 0,
                'July': 0,
                'August': 0,
                'September': 0,
                'October': 0,
                'November': 0,
                'December': 0
            };
            data.forEach(item => {
                const month = new Date(`2023-${item._id}-01`).toLocaleString('default', { month: 'long' });
                allMonths[month] = item.ordersCount;
            });
            console.log(allMonths);

            res.json(allMonths);
        }

        if (time === 'year') {
            
            const startYear = 2019;
            const endYear = 2024;
        
           
            const ordersByYear = {};
        
           
            for (let year = startYear; year <= endYear; year++) {
                const data = await Order.aggregate([
                    {
                        $match: {
                            createdOn: {
                                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            ordersCount: { $sum: 1 }
                        }
                    }
                ]);
        
                
                const orderCount = data.length > 0 ? data[0].ordersCount : 0;
        
                ordersByYear[year] = orderCount;
            }
        
            console.log(ordersByYear);
        
            res.json(ordersByYear);
        }



        if (time === 'week') {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
            
            
            
            const dayOfWeek = currentDate.getDay();
            
            
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            
            const startDate = new Date(currentYear, currentMonth, currentDay - dayOfWeek);
            
            
            const ordersByDayOfWeek = {};

            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + day);
                console.log(date);
                
                const data = await Order.aggregate([
                    {
                        $match: {
                            createdOn: {
                                $gte: new Date(date.setHours(0, 0, 0, 0)),
                                $lt: new Date(date.setHours(23, 59, 59, 999))
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            ordersCount: { $sum: 1 }
                        }
                    }
                ]);
                
                const orderCount = data.length > 0 ? data[0].ordersCount : 0;

                ordersByDayOfWeek[dayNames[day]] = orderCount;
            }
            
            console.log(ordersByDayOfWeek);
            
            res.json(ordersByDayOfWeek);
        }
        
        
        
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "An error occured while fetching the data";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
};





const excelDownload = async (req, res) => {
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

   
    worksheet.addRow(['Order ID', 'Product Name', 'Quantity', 'Price', 'Total']);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
    
    
    workbook.xlsx.write(res)
        .then(() => {
            res.end();
            
        })
        .catch((err) => {
            console.error('Error generating Excel:', err);
            const statusCode = 500;
        const errorMessage = "Error generating on excel download";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
        });
};

const reportPdf = async (req, res) => {
//    const orderId = req.query.id;
   const startDate=req.query.start
   const endDate=req.query.end
   let order
   if(startDate&&endDate){
     order = await Order.find({
        createdOn: {
            $gte: new Date(`${startDate}T00:00:00.000Z`), 
            $lte: new Date(`${endDate}T00:00:00.000Z`),   
        }, status: { $ne: 'pending' }
    }).populate('customerId')
   }else{
     order = await Order.find({ status: { $ne: 'pending' } }).populate('customerId');
   }
   
   
   const successOrder=await Order.find({status:'delivered'}).populate('customerId')
   const cancelledOrders= await Order.find({status:'Cancelled'})
   const pendingOrders=await Order.find({status:'pending'})
   const returnedOrders= await Order.find({status:'returned'})
let revenue=0
   for(let i=0;i<successOrder.length;i++){
    revenue+=successOrder[i].totalAmount
   }

   const doc = new PDFDocument();

   const stream = fs.createWriteStream('invoice.pdf');
   doc.pipe(stream);

   // Add content to the PDF


  
   doc

      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Sales Report', { align: 'center' })
      

   // Define table headers
   doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('Order Id', 50, 150)
      .text('Customer', 170, 150)
      .text('Email', 220, 150)
      .text('Date', 350, 150)
      .text('orderStatus', 400, 150)
      .text('Amount', 450, 150)
      .text('Payment', 490, 150);

      doc
              .strokeColor("#aaaaaa")
              .lineWidth(1)
              .moveTo(50, 165)
              .lineTo(550, 165)
              .stroke();
   // Add table content
   let yPos = 180; // Vertical position for the first row
//    order.products.forEach((product) => {
//       const subtotal = product.salePrice * product.quantity;
     
//    });

for(let i=0;i<order.length;i++){
    let date=new Date(order[i].createdOn)
    let newDate= date.toLocaleDateString()
    doc
    .font('Helvetica')
    .fontSize(8)
    .text(order[i].orderId, 50, yPos)
      .text(order[i].customerId.name, 170, yPos)
      .text(order[i].customerId.email, 220, yPos)
      .text(newDate, 350, yPos)
      .text(order[i].status, 400, yPos)
      .text(order[i].totalAmount, 450, yPos)
      .text(order[i].paymentMethod, 490, yPos);
    yPos += 20;
}
yPos+=50
 // Move to the next row
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Order Summary',50,yPos)
    .font('Helvetica')
    .fontSize(10)
    .text(`Total Number Of Orders `,70,yPos+20 )
    .text(`: ${order.length}`,190,yPos+20)
    .text(`Total Revenue Earned `,70,yPos+40)
    .text(`: ${revenue} /-`,190,yPos+40)
    .text(`Cancelled Orders `,70,yPos+60)
    .text(`: ${cancelledOrders.length}`,190,yPos+60)
    .text(`Pending Orders `,70,yPos+80)
    .text(`: ${pendingOrders.length}`,190,yPos+80)
    .text(`Returned Orders `,70,yPos+100)
    .text(`: ${returnedOrders.length}`,190,yPos+100)

   // Finalize the PDF
   doc.end();

   // Set response headers for downloading the PDF
   res.setHeader('Content-Type', 'application/pdf');
   res.setHeader('Content-Disposition', `attachment; filename=invoice_.pdf`);

   // Pipe the PDF to the response object
   doc.pipe(res);
};

// const reportPdf=async (req,res)=>{
//     try {
//         const doc=new PDFDocument()
//         const stream = fs.createWriteStream('sale.pdf');
//         doc.pipe(stream);
//         // const id = req.params.orderId;
//         const order = await Order.find().populate('customerId');
        
    
//         function generateHeader(doc) {
//             doc
//               .image("public/assets/imgs/theme/LOGO.png", 50, 45, { width: 100 })
//               .fillColor("#444444")
//               .fontSize(20)
//               .fontSize(10)
//               .text("SCO Sports", 200, 50, { align: "right" })
//               .text("Head Office: Ernakulam", 200, 65, { align: "right" })
//               .text("Kerala-686612", 200, 80, { align: "right" })
//               .moveDown();
//           }
          
          
//         function generateInvoiceTable(doc, invoice) {
//             let i;
//             const invoiceTableTop = 330;
          
//             doc.font("Helvetica-Bold");
//             generateTableRow( doc,invoiceTableTop,"orderId","customerName","Email","Date","Order Status","Amount","Payment");
//             generateHr(doc, invoiceTableTop + 20);
//             doc.font("Helvetica");
          
//             for (i = 0; i < invoice.length; i++) {
//               const item = invoice[i];
//               const position = invoiceTableTop + (i + 1) * 30;
//               generateTableRow( doc,position,item.OrderId,item.customerId.name,item.customerId.email,item.customerId.name,item.status,item.totalAmount,
//               item.paymentMethod);
          
//               generateHr(doc, position + 20);
//             }
          
//             const subtotalPosition = invoiceTableTop + (i + 1) * 30;
//             generateTableRow(
//               doc,
//               subtotalPosition,
//               "",
//               "",
//               "Subtotal",
//               "",
//               formatCurrency(invoice.subtotal)
//             );
          
//             const paidToDatePosition = subtotalPosition + 20;
//             generateTableRow(
//               doc,
//               paidToDatePosition,
//               "",
//               "",
//               "Paid To Date",
//               "",
//               formatCurrency(invoice.paid)
//             );
          
//             const duePosition = paidToDatePosition + 25;
//             doc.font("Helvetica-Bold");
//             generateTableRow(
//               doc,
//               duePosition,
//               "",
//               "",
//               "Balance Due",
//               "",
//               formatCurrency(invoice.subtotal - invoice.paid)
//             );
//             doc.font("Helvetica");
//           }
          
//         function generateFooter(doc) {
//             doc
//               .fontSize(10)
//               .text(
//                 "Payment is due within 15 days. Thank you for your business.",
//                 50,
//                 780,
//                 { align: "center", width: 500 }
//               );
//           }
          
//           function generateTableRow(doc,y,orderId,customerName,Email,Date,OrderStatus,Amount,Payment
//           ) {
//             doc
//               .fontSize(10)
//               .text(orderId, 50, y)
//               .text(customerName, 100, y)
//               .text(Email, 180, y, { width: 90, align: "right" })
//               .text(Date, 220, y, { width: 90, align: "right" })
//               .text(OrderStatus, 280, y, { align: "right" })
//               .text(Amount, 370, y, { align: "right" })
//               .text(Payment, 380, y, { align: "right" })
//           }
          
//           function generateHr(doc, y) {
//             doc
//               .strokeColor("#aaaaaa")
//               .lineWidth(1)
//               .moveTo(50, y)
//               .lineTo(550, y)
//               .stroke();
//           }
          
//           function formatCurrency(cents) {
//             return "$" + (cents / 100).toFixed(2);
//           }
          
//           function formatDate(date) {
//             const day = date.getDate();
//             const month = date.getMonth() + 1;
//             const year = date.getFullYear();
          
//             return year + "/" + month + "/" + day;
//           }
          
    
//             generateHeader(doc);
            
//             generateInvoiceTable(doc, order);
//             generateFooter(doc);
          
//             doc.end();
//             res.setHeader('Content-Type', 'application/pdf');
//             res.setHeader('Content-Disposition', `attachment; filename=sales_.pdf`);

            

//             doc.pipe(res);
        
    
        
    
//         // Now, send the generated PDF as a download
        
    

    
//       } catch (error) {
//         console.log(error);
//     }
// }




const salesFilter = async (req, res) => {
    try {
        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        
        let orders
       if(startDate&&endDate){
         orders = await Order.find({
            createdOn: {
                $gte: new Date(`${startDate}T00:00:00.000Z`), 
                $lte: new Date(`${endDate}T00:00:00.000Z`),   
            }, status: { $ne: 'pending' }
        }).populate('customerId')
    }else{
         orders = await Order.find({ status: { $ne: 'pending' } }).populate('customerId')
         
    }
    let order=orders.slice(skip,skip+limit)
    
    
    let pageLimit=Math.ceil(orders.length/limit)
    
    
  
        res.render("salesReport",{order:order,startDate,endDate,page,pageLimit})
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Error filtering sales";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const bannerPage=async (req,res)=>{
    try {

        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        const banners=await Banner.find({})
        const banner=await Banner.find({}).skip(skip).limit(limit)
        let pageLimit=Math.ceil(banners.length/limit)
        res.render("banner",{banner,page,pageLimit})
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}

const addBanner=async (req,res)=>{
    try {
        const discription = req.body.discription
       let Imagefile = req.file ? req.file.filename : null;
       const h1 = req.body.h1
       const h2 = req.body.h2
       const h3 = req.body.h3
       const p1 = req.body.p1

       if(req.file){
        const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = "public/admin-assets/imgs/croppedBanner/"
            
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            const croppedImage = await sharp(req.file.path)
                .resize(2200, 1200, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                Imagefile= imgFileName
            }
        }

       const banner = new Banner({
        Discription:discription,
        status:1,
        Image:Imagefile,
        h1:h1,
        h2:h2,
        h3:h3,
        p1:p1
       })
       

       const result =  await banner.save()
       if(result){
        console.log("banner updated")
        res.redirect('/admin/banner?page=1')
       }else{
        res.json({error:"error updating banner , try again"})
       }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}




const updateBannerStatus = async (req,res)=>{
    try {
        const _id = req.body._id; 
        let bannerData = await Banner.findById(_id)

        if (!bannerData) {
            return res.status(404).json({ error: "Banner not found" });
        }

        const newStatus = bannerData.status ? 0 : 1;
        bannerData.status = newStatus
        await bannerData.save()

        res.json({ success: true  , update:bannerData.status , bannerId:_id});
       
    } catch (error) {
        console.log(error.message)
        res.status(500).json({error:"Internal server error"})
    }
}


const editBannerPage=async (req,res)=>{
    try {
        const banner=await Banner.findOne({_id:req.query.id})
        res.render("editBanner",{banner:banner})
    } catch (error) {
        console.log(error);
        res.status(500).json({error:"Internal server error"})
    }
}


const editBanner = async (req, res) => {
    try {
        const banner = await Banner.findOne({ _id: req.body.bannerId });       
        const discription = req.body.discription;
        console.log(req.body.bannerId);
        let Imagefile = req.file ? req.file.filename : banner ? banner.Image : null;
        
        const h1 = req.body.h1;
        const h2 = req.body.h2;
        const h3 = req.body.h3;
        const p1 = req.body.p1;
        if(req.file){
        const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = "public/admin-assets/imgs/croppedBanner/"
            
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            const croppedImage = await sharp(req.file.path)
                .resize(2200, 1200, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                Imagefile= imgFileName
            }
        }
        if (banner) {
            const update = await Banner.updateOne(
                { _id: req.body.bannerId },
                {
                    $set: {
                        Discription: discription,
                        Image: Imagefile,
                        h1: h1,
                        h2: h2,
                        h3: h3,
                        p1: p1,
                    },
                }
            );
            

            if(update){
                res.redirect("/admin/banner?page=1")
            }   
        } else {
            res.status(404).json({ error: "Banner not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports = {
    loadAdminLogin, verifyAdmin, loadAdminHome, adminLogout, forgetPage1, forget1, forgetPage, forget,

    categoryPage, addCategory, deleteCategory, editCategoryPage, editCategory,

    addProductPage, productShowPage, addProduct, editProductPage, editProduct, deleteProduct, deletedProductsPage, addFromDelete, deleteImage,
    

    usersShowPage, usersStatusBlock, usersStatusUnblock,

    brandsShowPage, addBrandPage, addBrand, brandsEditPage, brandsEdit, deleteBrand,

    orderDetailsPage,editOrderPage,updateOrder,approveReturn,rejectReturn,

    couponManagementPage,editCouponPage,addCoupon,editCoupon,deleteCoupon,

    fetchDataGraph,excelDownload,reportPdf,salesFilter,bannerPage,addBanner,updateBannerStatus,editBannerPage,editBanner

}