const mongoose=require("mongoose")

const couponSchema=mongoose.Schema({
   couponCode:{
    type:String
   },
   couponDescription:{
    type:String
   },
   couponDiscount:{
    type:Number
   },
   couponExpiry:{
    type:Date
   },
   maximumAmount:{
    type:Number
   },
   minimumAmount:{
    type:Number
   },
   createdOn:{
    type:Date
   },
   customers:[{
      customerId:{
         type:String
      }
   }
   ]
})

module.exports=mongoose.model("coupon",couponSchema,"coupon")