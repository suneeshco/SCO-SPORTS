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
const PDFDocument = require('pdfkit');
const fs = require('fs');
require('dotenv').config()



var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });


  const checkoutPage = async (req, res) => {
    try {
        couponCodes=""
        const category = await Category.find({ list: true })
        const customer = await Customer.findOne({ _id: res.locals.user._id });
        const userData = await Customer.findOne({ _id: res.locals.user._id }).populate('cart.productId')
        const productData = userData.cart.map((item) => { return item.productId })
        const date=new Date()
        const coupons=await Coupon.find({couponExpiry: { $gte: date },customers: {
            $not: {
                $elemMatch: {
                    customerId: customer._id,
                },
            },
        }})
        let priceArray = []
        for (let i = 0; i < userData.cart.length; i++) {
            let subPrice = (userData.cart[i].quantity) * (productData[i].offerPrice)
            priceArray.push(subPrice)
        }


        let cartTotal = 0

        for (let i = 0; i < customer.cart.length; i++) {
            cartTotal = cartTotal + priceArray[i]
        }
        res.render("checkout", { category: category, productData: productData, userData: userData, items: customer.cart, cartTotal: cartTotal, priceArray: priceArray ,coupons})
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const orderSuccessfulPage = async (req, res) => {
    try {
        const id = req.params.id

        res.render("orderSuccessful", { orderId: id })
    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



function generateOrderId() {
    const timestamp = new Date().getTime(); // Get the current timestamp
    const random = Math.floor(Math.random() * 10000); // Generate a random number

    // Combine the timestamp and random number to create a unique order ID
    const orderId = `ORD-${timestamp}-${random}`;
    return orderId;
}


const  placeOrder = async (req, res) => {
    try {
        const orderID = generateOrderId()
        // const items = JSON.parse(req.body.items);
        const userData = await Customer.findOne({ _id: req.body.userId }).populate('cart.productId')
        const items=userData.cart

        const productData = userData.cart.map((item) => { return item.productId })

       
        const customer=await Customer.findOne({_id:req.body.userId})

        let priceArray = []
        for (let i = 0; i < userData.cart.length; i++) {
            let subPrice = (userData.cart[i].quantity) * (productData[i].offerPrice)
            priceArray.push(subPrice)
        }


        let cartTotal = 0

        for (let i = 0; i < customer.cart.length; i++) {
            cartTotal = cartTotal + priceArray[i]
        }
        let discount=0
        let grandTotal=cartTotal
        console.log("grand",cartTotal);

        const found= await Coupon.findOne({couponCode:couponCodes})
        if(found){
            
            let discounted=Math.ceil(cartTotal*(found.couponDiscount/100))
            if(discounted>found.maximumAmount){
                discount=found.maximumAmount
            }
            else{
                discount=discounted
            }
            grandTotal=cartTotal-discount
            console.log("inside",discount);
           
        }
        
        // const cartTotal = req.body.cartTotal
        const item = []

        const outOfStockItems = [];
        

        for (let i = 0; i < items.length; i++) {
            const productId = items[i].productId;
            const quantity = items[i].quantity;

            // Check if there's enough stock for the product
            const product = await Product.findById(productId);

            if (product.stock >= quantity) {
                
                item.push({
                    productId: productId,
                    quantity: quantity,
                    size: items[i].size,
                    subtotal: priceArray[i]
                })
            } else {
                outOfStockItems.push(productId)
            }
        }
        
        if (outOfStockItems.length === 0) {
            const customerData = JSON.parse(req.body.customer);

            const date = new Date()
            const add = customerData.address.find((addr) => { return addr._id.toString() === req.body.address.toString() })


            const order = new Order({
                customerId: customerData._id,
                address: {
                    name: add.name,
                    houseName: add.houseName,
                    street: add.street,
                    city: add.city,
                    district: add.district,
                    state: add.state,
                    pin: add.pin
                },
                paymentMethod: req.body.payment_option,
                shippingCharge: 0,
                discount: discount,
                totalAmount: grandTotal,
                total:cartTotal,
                createdOn: date,
                status: "pending",
                deliveryStatus:false,
                items: item,
                orderId: orderID

            })
            const data = await order.save()

            function generateRazorpay(id,totalAmount){
                
                return new Promise ((resolve,reject)=>{
                    var options = {
                        amount: totalAmount*100,  // amount in the smallest currency unit
                        currency: "INR",
                        receipt: id
                      };
                      instance.orders.create(options, function(err, order) {
                        console.log(order);
                        resolve(order)
                      });
                })
            }

            if (data) {
                
                if(req.body.payment_option==="Cash On Delivery"){
                    for (let i = 0; i < items.length; i++) {
                        const productId = items[i].productId;
                        const quantity = items[i].quantity;
                    
                        // Check if there's enough stock for the product
                        const product = await Product.findById(productId);
                    
                        if (product.stock >= quantity) {
                            // Sufficient stock, update the stock for the product
                            product.stock -= quantity;
                            await product.save();
                        } else {
                            // Insufficient stock for this product
                            return res.json({ error: 'Insufficient stock for some items in your cart' });
                        }
                    }
                    const success = await Customer.updateMany({ _id: customerData._id }, { $set: { cart: [] } });
                    const succ=await Order.updateMany({_id:data._id},{$set:{paymentStatus:true}})
                    res.json({codSuccess:true,ordered:data._id})
                }else{
                    generateRazorpay(data._id,data.totalAmount).then((response)=>{
                        res.json({responsed:response})
                    })
                }
            }
        } else {
            return res.json({ error: 'Some items are out of stock' });
        }

    } catch (error) {
        console.log(error.message)
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const onlinePayment=async (req,res)=>{
    try {
        
        const userId=req.params.id
        const {payment,order}=req.body
        let or=JSON.parse(order)
        let orderId=or.receipt
        const userData=await Customer.findOne({_id:userId})
        let items=userData.cart
        
        for (let i = 0; i < items.length; i++) {
            const productId = items[i].productId;
            const quantity = items[i].quantity;

            const product = await Product.findById(productId)
            product.stock -= quantity
            await product.save()
        }
        const success = await Customer.updateMany({ _id: userId }, { $set: { cart: [] } });

        const succ= await Order.updateMany({_id:orderId},{$set:{paymentStatus:true}})
        
        const found= await Coupon.updateOne({couponCode:couponCodes},{ $push: { customers: { customerId: userId} }})
            res.json({orderId:orderId})
        

    } catch (error) {
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage }); 
    }
}

var couponCodes
const applyCoupon=async (req,res)=>{
    try {
        const code = req.body.code
        couponCodes=code
        const cartTotal=req.body.cartTotal
        const userId=req.body.userId
        
        const found= await Coupon.findOne({couponCode:code,customers: {
            $not: {
                $elemMatch: {
                    customerId: userId,
                },
            },
        }})
        const dateNow=new Date()
        if(found){
            if(dateNow<=found.couponExpiry){
                if(cartTotal>=found.minimumAmount){
                    let discount=Math.ceil(cartTotal*(found.couponDiscount/100))
                    if(discount>found.maximumAmount){
                        discount=found.maximumAmount
                    }
                    let grandTotal=cartTotal-discount
                    res.json({grandTotal:grandTotal,discount:discount})
                }else{
                    res.json({minimumValid:"Minimum purchase amount should be maintained"})
                }
            }else{
                res.json({expiry:"Coupon Not Available"})
            }
        }else{
            res.json({noCoupon:"Coupon Not Available"})
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const orderDetailsPage = async (req, res) => {
    try {
        let limit=6
        let page=req.query.page
        let pageNumber=page ? parseInt(page) : 1
        let skip=(pageNumber - 1) * limit
        let totalCount=await Order.countDocuments({customerId: res.locals.user._id,paymentStatus:true})
        const order = await Order.find({ customerId: res.locals.user._id,paymentStatus:true }).sort({createdOn:-1}).skip(skip).limit(limit)
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const category = await Category.find({ list: true })
        let pageLimit=Math.ceil(totalCount/limit)
        console.log(pageLimit);


        res.render("userOrders", { category: category, order: order, userData: userData,page:pageNumber,pageLimit })
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const userData = await Customer.findOne({ _id: res.locals.user._id })
        const order = await Order.findById(orderId)
        const addressData = order.address
        const orderDetails = await Order.findOne({ _id: orderId }).populate('items.productId')
        const productData = orderDetails.items.map((item) => { return item.productId })


        const deliveredOnTimestamp = new Date(order.deliveredOn); // Replace with your timestamp
        const orderedTimeStamp = new Date(order.createdOn)

        // Extract the date and format it as a string
        const deliveryDate = deliveredOnTimestamp.toLocaleDateString();
        const orderedDate = orderedTimeStamp.toLocaleDateString()

        // Output: "10/27/2023" (date may be formatted differently based on your locale settings)



        const category = await Category.find({ list: true })

        res.render("orderDetails", { category: category, addressData: addressData, order: order, productData: productData, items: orderDetails.items, userData: userData, deliveryDate: deliveryDate, orderedDate: orderedDate })
    } catch (error) {
        console.log(error.message)
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}



const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const cancel = await Order.findByIdAndUpdate({ _id: orderId }, { $set: { status: "Cancelled" } })
        const orderDetail = await Order.findOne({ _id: orderId })
        const customer=await Customer.findOne({_id:res.locals.user._id})
        if (cancel) {
            for (let i = 0; i < orderDetail.items.length; i++) {
                let product = await Product.findOne({ _id: orderDetail.items[i].productId })
                product.stock = product.stock + orderDetail.items[i].quantity
                await product.save()
            }
            if(orderDetail.paymentMethod=="Online Payment"){
                customer.wallet=(customer.wallet+orderDetail.totalAmount)??orderDetail.totalAmount
                customer.transactionDetails.push({
                    transactionType:"credit",
                    transactionAmount:orderDetail.totalAmount,
                    transactionDate:new Date(),
                    orderId:orderDetail._id
                })
                await customer.save()
            }
            res.redirect("/userOrders")
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }
}


const returnOrderApply = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const { reason } = req.body
        const order = await Order.updateOne({ _id: orderId }, { $set: { returnReason: reason, return: true, returnStatus: "return pending" } })
        if (order) {
            res.json({ success: true })
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }

}



const cancelReturn = async (req, res) => {
    try {
        const orderId = req.params.orderId

        const order = await Order.updateOne({ _id: orderId }, { $set: { returnReason: null, return: false, returnStatus: null } })
        if (order) {
            res.redirect("/userOrders")
        }
    } catch (error) {
        console.log(error);
        const statusCode = 500;
        const errorMessage = "Internal Server Error";
        res.status(statusCode).render('errorPage', { statusCode, errorMessage });
    }

}

function generateInvoice() {
    const timestamp = new Date().getTime(); // Get the current timestamp
    const random = Math.floor(Math.random() * 10000); // Generate a random number

    // Combine the timestamp and random number to create a unique order ID
    const invoiceId = `INV-${timestamp}-${random}`;
    return invoiceId;
}

const downloadInvoice = async (req, res) => {
  try {
    const invoiceId= generateInvoice()
    const id = req.params.orderId;
    const order = await Order.findOne({ _id: id }).populate('items.productId');
    
    if (!order ) {
      return res.status(404).send('Invoice not available for this order');
    }

    const invoicePath = `public/invoices/invoice_${order.orderId}.pdf`;
    const invoice={
        shipping:order.address,
        items:order.items,
        discount:order.discount,
        subtotal:order.total,
        grandTotal:order.totalAmount,
        orderId:order.orderId
      }

      function generateHeader(doc) {
        doc
          .image("public/assets/imgs/theme/LOGO.png", 50, 45, { width: 100 })
          .fillColor("#444444")
          .fontSize(20)
          .fontSize(10)
          .text("SCO Sports", 200, 50, { align: "right" })
          .text("Head Office: Ernakulam", 200, 65, { align: "right" })
          .text("Kerala-686612", 200, 80, { align: "right" })
          .moveDown();
      }
      
      function generateCustomerInformation(doc, invoice) {
        doc
          .fillColor("#444444")
          .fontSize(20)
          .text("Invoice", 50, 160);
      
        generateHr(doc, 185);
      
        const customerInformationTop = 200;
      
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`Invoice Number: ${invoiceId}`, 50, customerInformationTop)
          .text(`OrderId Number: ${order.orderId}`, 50, customerInformationTop+20)
          
          
          .text("Invoice Date:", 50, customerInformationTop + 40)
          .text(formatDate(new Date()), 150, customerInformationTop + 40)

          .text("Delivered Date:", 50, customerInformationTop + 60)
          .text(formatDate(order.deliveredOn), 150, customerInformationTop + 60)
      
          .font("Helvetica-Bold")
          .text(invoice.shipping.name, 400, customerInformationTop)
          .font("Helvetica")
          .text(invoice.shipping.houseName, 400, customerInformationTop + 15)
          .text(invoice.shipping.street + ", " +invoice.shipping.city,400,customerInformationTop + 30)
          .text(invoice.shipping.district +", "+invoice.shipping.state,400,customerInformationTop + 45)
          .text(invoice.shipping.pin,400,customerInformationTop + 60)
            
          .moveDown();
      
        generateHr(doc, 280);
      }
      
      function generateInvoiceTable(doc, invoice) {
        let i;
        const invoiceTableTop = 330;
        const maxProductNameWidth = 150
        let distance
      
        doc.font("Helvetica-Bold");
        generateTableRow( doc,invoiceTableTop,"Item","Quantity","Unit Cost","Sub Total");
        generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");
        let position = invoiceTableTop+30
        for (i = 0; i < invoice.items.length; i++) {
          const item = invoice.items[i];
           
          generateTableRow( doc,position,item.productId.title,item.quantity,formatCurrency(item.productId.offerPrice),
          formatCurrency(item.subtotal),maxProductNameWidth);
            position=position+40
            distance=position
        //   generateHr(doc, position);
        }
      console.log(invoice);
        const subtotalPosition = distance+20;
        generateTableRow(
          doc,
          subtotalPosition,
          "",
          "",
          "Subtotal",
          formatCurrency(invoice.subtotal),""
          
        );
      
        const discountPosition = subtotalPosition + 20;
        generateTableRow(
            doc,
            discountPosition,
            "",
            "",
            "Discount",
            formatCurrency(invoice.discount),""
            
          );
      
        const grandPosition = discountPosition + 25;
        doc.font("Helvetica-Bold");
        generateTableRow(
            doc,
            grandPosition,
            "",
            "",
            "Grand Total",
            formatCurrency(invoice.grandTotal),""
            
          );
        doc.font("Helvetica");
      }
      
      function generateFooter(doc) {
        doc
          .fontSize(10)
          .text(
            " Thank you for your business.",
            50,
            780,
            { align: "center", width: 500 }
          );
      }
      
      function generateTableRow(
        doc,
        y,
        item,
        quantity,
        unitCost,
        subTotal,maxProductNameWidth
      ) {
        doc
          .fontSize(10)
          .text(item, 50, y,{ width: maxProductNameWidth })
          .text(quantity, 220, y, { width: 90, align: "center" })
          .text(unitCost, 320, y, { width: 90, align: "center" })
          .text(subTotal,400, y, { align: "center" });
      }
      
      function generateHr(doc, y) {
        doc
          .strokeColor("#aaaaaa")
          .lineWidth(1)
          .moveTo(50, y)
          .lineTo(550, y)
          .stroke();
      }
      
      function formatCurrency(cents) {
        return "₹" + cents;
      }
      
      function formatDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
      
        return year + "/" + month + "/" + day;
      }

    function createInvoice(invoice, path) {
        let doc = new PDFDocument({ size: "A4", margin: 50 });

        generateHeader(doc);
        generateCustomerInformation(doc, invoice);
        generateInvoiceTable(doc, invoice);
        generateFooter(doc);
      
        doc.end();
        doc.pipe(fs.createWriteStream(path));
    }

    createInvoice(invoice, invoicePath);

    // Now, send the generated PDF as a download
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.download(invoicePath, `invoice_${order.orderId}.pdf`);

  } catch (error) {
    console.log(error);
    const statusCode = 500;
    const errorMessage = "Error During Generating Invoice";
    res.status(statusCode).render('errorPage', { statusCode, errorMessage });
  }
};

  

module.exports={
    checkoutPage,orderSuccessfulPage,placeOrder,onlinePayment,applyCoupon,orderDetailsPage,orderDetails,cancelOrder,returnOrderApply,
    cancelReturn,downloadInvoice
}