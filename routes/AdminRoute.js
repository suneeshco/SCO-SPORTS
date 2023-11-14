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

adminRoute.get("/admin",validate.requireAuth1,adminController.loadAdminLogin)
adminRoute.post("/admin",adminController.verifyAdmin)
adminRoute.get("/admin/dashboard",validate.requireAuth,adminController.loadAdminHome)
adminRoute.get("/admin/logout",validate.requireAuth,adminController.adminLogout)
adminRoute.get("/admin/forgetPassword1",validate.requireAuth1,adminController.forgetPage1)
adminRoute.post("/admin/forgetPassword1",adminController.forget1)
adminRoute.get("/admin/forgetPassword",validate.requireAuth1,adminController.forgetPage)
adminRoute.post("/admin/forgetPassword",adminController.forget)




//Category 

adminRoute.get("/admin/category",validate.requireAuth,adminController.categoryPage)
adminRoute.post("/admin/category",adminController.addCategory)
adminRoute.get("/admin/category/edit",validate.requireAuth,adminController.editCategoryPage)
adminRoute.post("/admin/category/edit",adminController.editCategory)
adminRoute.get("/admin/category/delete",validate.requireAuth,adminController.deleteCategory)



//Product

adminRoute.get("/admin/products/addProduct",validate.requireAuth,adminController.addProductPage)
adminRoute.get("/admin/products",validate.requireAuth,adminController.productShowPage)
adminRoute.post('/admin/products/addProduct', upload1.array('productImages', 3),adminController.addProduct)
adminRoute.get("/admin/products/edit/:productId",validate.requireAuth,adminController.editProductPage)
adminRoute.post('/admin/products/edit', upload1.array('productImages', 3),adminController.editProduct)
adminRoute.get('/admin/products/delete',validate.requireAuth,adminController.deleteProduct)
adminRoute.get('/admin/products/deletedProducts',validate.requireAuth,adminController.deletedProductsPage)
adminRoute.get('/admin/products/addFromDelete',validate.requireAuth,adminController.addFromDelete)
// adminRoute.get("/admin/products/edit/deleteImage",adminController.deleteImage)
adminRoute.post("/admin/products/edit/deleteImg/:imgId",adminController.deleteImage)
adminRoute.get("/admin/salesReport",adminController.salesReportPage)




//users

adminRoute.get("/admin/users",validate.requireAuth,adminController.usersShowPage)
adminRoute.get("/admin/users/userStatusBlock",validate.requireAuth,adminController.usersStatusBlock)
adminRoute.get("/admin/users/userStatusUnblock",validate.requireAuth,adminController.usersStatusUnblock)



//brand

adminRoute.get("/admin/brands",validate.requireAuth,adminController.brandsShowPage)
adminRoute.get("/admin/brands/addNewBrand",validate.requireAuth,adminController.addBrandPage)
adminRoute.post("/admin/brands/addNewBrand",upload.single("image"),adminController.addBrand)
adminRoute.get("/admin/brands/edit",validate.requireAuth,adminController.brandsEditPage)
adminRoute.post("/admin/brands/edit",upload.single("image"),adminController.brandsEdit)
adminRoute.get("/admin/brands/delete",validate.requireAuth,adminController.deleteBrand)
// adminRoute.get("/admin/brands/deleteImage/:brandId",adminController.brandImageDelete)



//orders

adminRoute.get("/admin/orders",validate.requireAuth,adminController.orderDetailsPage)
adminRoute.get("/editOrders/:orderId",validate.requireAuth,adminController.editOrderPage)
adminRoute.post("/updateOrder",adminController.updateOrder)
adminRoute.get("/approveReturn/:orderId",adminController.approveReturn)
adminRoute.get("/rejectReturn/:orderId",adminController.rejectReturn)




//coupons

adminRoute.get("/admin/coupons",validate.requireAuth,adminController.couponManagementPage)
adminRoute.get("/couponManagement/edit/:couponId",validate.requireAuth,adminController.editCouponPage)
adminRoute.post("/addCoupon",adminController.addCoupon)
adminRoute.post("/updateCoupon",adminController.editCoupon)
adminRoute.get("/couponManagement/delete",adminController.deleteCoupon)


adminRoute.post("/fetchData/:time",adminController.fetchDataGraph)
adminRoute.post("/downloadExcel",adminController.excelDownload)
adminRoute.get("/downloadPdfReport",adminController.reportPdf)
adminRoute.get("/salesFilter",adminController.salesFilter)
adminRoute.get("/admin/banner",adminController.bannerPage)
adminRoute.post("/admin/banner",upload2.single('image'),adminController.addBanner)
adminRoute.post("/admin/updateBannerStatus",adminController.updateBannerStatus)
adminRoute.get("/admin/editBanner",adminController.editBannerPage)
adminRoute.post("/admin/editBanner",upload2.single('image'),adminController.editBanner)


module.exports=adminRoute