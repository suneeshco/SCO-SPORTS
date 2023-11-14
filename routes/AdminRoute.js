const express=require("express")
const adminRoute=express()
const adminController=require("../controller/adminController")
const multer=require("multer")
const path=require("path")

require('dotenv').config();
const cookieparser = require('cookie-parser')
const validate = require('../middleware/adminAuth');
adminRoute.use(cookieparser())
const nocache = require('nocache')
adminRoute.use(nocache())
adminRoute.get('*',validate.checkAdmin)

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'brand_images'); // Set the destination folder for uploads
  },
  filename: function (req, file, cb) {
      // Generating a unique filename for the uploaded file
      cb(null, Date.now() + path.extname(file.originalname));
  }
});




const upload=multer({storage:storage})


const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'brand_images'); // Define the folder where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
  });


  const upload1=multer({storage:storage1})





  const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/admin-assets/imgs/banner'); // Set the destination folder for uploads
    },
    filename: function (req, file, cb) {
        // Generating a unique filename for the uploaded file
        cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  
  
  
  const upload2=multer({storage:storage2})

const session=require("express-session")

adminRoute.set("view engine","ejs")
adminRoute.set("views","./view/adminView")

adminRoute.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true
    })
);


//demo

adminRoute.get("/sample",(req,res)=>{res.render("sample")})



//admin authentication

adminRoute.get("/",validate.requireAuth1,adminController.loadAdminLogin)
adminRoute.post("/",adminController.verifyAdmin)
adminRoute.get("/dashboard",validate.requireAuth,adminController.loadAdminHome)
adminRoute.get("/logout",validate.requireAuth,adminController.adminLogout)
adminRoute.get("/forgetPassword1",validate.requireAuth1,adminController.forgetPage1)
adminRoute.post("/forgetPassword1",adminController.forget1)
adminRoute.get("/forgetPassword",validate.requireAuth1,adminController.forgetPage)
adminRoute.post("/forgetPassword",adminController.forget)




//Category 

adminRoute.get("/category",validate.requireAuth,adminController.categoryPage)
adminRoute.post("/category",adminController.addCategory)
adminRoute.get("/category/edit",validate.requireAuth,adminController.editCategoryPage)
adminRoute.post("/category/edit",adminController.editCategory)
adminRoute.get("/category/delete",validate.requireAuth,adminController.deleteCategory)



//Product

adminRoute.get("/products/addProduct",validate.requireAuth,adminController.addProductPage)
adminRoute.get("/products",validate.requireAuth,adminController.productShowPage)
adminRoute.post('/products/addProduct', upload1.array('productImages', 3),adminController.addProduct)
adminRoute.get("/products/edit/:productId",validate.requireAuth,adminController.editProductPage)
adminRoute.post('/products/edit', upload1.array('productImages', 3),adminController.editProduct)
adminRoute.get('/products/delete',validate.requireAuth,adminController.deleteProduct)
adminRoute.get('/products/deletedProducts',validate.requireAuth,adminController.deletedProductsPage)
adminRoute.get('/products/addFromDelete',validate.requireAuth,adminController.addFromDelete)
// adminRoute.get("/admin/products/edit/deleteImage",adminController.deleteImage)
adminRoute.post("/products/edit/deleteImg/:imgId",adminController.deleteImage)
adminRoute.get("/salesReport",adminController.salesReportPage)




//users

adminRoute.get("/users",validate.requireAuth,adminController.usersShowPage)
adminRoute.get("/users/userStatusBlock",validate.requireAuth,adminController.usersStatusBlock)
adminRoute.get("/users/userStatusUnblock",validate.requireAuth,adminController.usersStatusUnblock)



//brand

adminRoute.get("/brands",validate.requireAuth,adminController.brandsShowPage)
adminRoute.get("/brands/addNewBrand",validate.requireAuth,adminController.addBrandPage)
adminRoute.post("/brands/addNewBrand",upload.single("image"),adminController.addBrand)
adminRoute.get("/brands/edit",validate.requireAuth,adminController.brandsEditPage)
adminRoute.post("/brands/edit",upload.single("image"),adminController.brandsEdit)
adminRoute.get("/brands/delete",validate.requireAuth,adminController.deleteBrand)
// adminRoute.get("/admin/brands/deleteImage/:brandId",adminController.brandImageDelete)



//orders

adminRoute.get("/orders",validate.requireAuth,adminController.orderDetailsPage)
adminRoute.get("/editOrders/:orderId",validate.requireAuth,adminController.editOrderPage)
adminRoute.post("/updateOrder",adminController.updateOrder)
adminRoute.get("/approveReturn/:orderId",adminController.approveReturn)
adminRoute.get("/rejectReturn/:orderId",adminController.rejectReturn)




//coupons

adminRoute.get("/coupons",validate.requireAuth,adminController.couponManagementPage)
adminRoute.get("/couponManagement/edit/:couponId",validate.requireAuth,adminController.editCouponPage)
adminRoute.post("/addCoupon",adminController.addCoupon)
adminRoute.post("/updateCoupon",adminController.editCoupon)
adminRoute.get("/couponManagement/delete",adminController.deleteCoupon)


adminRoute.post("/fetchData/:time",adminController.fetchDataGraph)
adminRoute.post("/downloadExcel",adminController.excelDownload)
adminRoute.get("/downloadPdfReport",adminController.reportPdf)
adminRoute.get("/salesFilter",adminController.salesFilter)
adminRoute.get("/banner",adminController.bannerPage)
adminRoute.post("/banner",upload2.single('image'),adminController.addBanner)
adminRoute.post("/updateBannerStatus",adminController.updateBannerStatus)
adminRoute.get("/editBanner",adminController.editBannerPage)
adminRoute.post("/editBanner",upload2.single('image'),adminController.editBanner)


module.exports=adminRoute