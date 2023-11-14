const mongoose=require("mongoose")

const orderSchema=mongoose.Schema({
    customerId:{
        type:mongoose.Types.ObjectId,
        ref:'customer',
        required:true
    },
    items:[{
        productId:{
            type:mongoose.Types.ObjectId,
            ref:'product'
        },
        quantity:{
            type:Number
        },
        size:{
            type:Number
        },
        subtotal:{
            type:Number
        }
    }],
    address:{
        name:{
            type:String
        },
        houseName:{
            type:String
        },
        street:{
            type:String
        },
        city:{
            type:String
        },
        district:{
            type:String
        },
        state:{
            type:String
        },
        pin:{
            type:String
        }
    },
    paymentMethod:{
        type:String,
        required:true
    },
    paymentStatus:{
        type:String
    },
    shippingCharge:{
        type:Number
    },
    discount:{
        type:Number
    },
    totalAmount:{
        type:Number
    },
    total:{
        type:Number
    },
    createdOn:{
        type:Date
    },
    deliveredOn:{
        type:Date
    },
    status:{
        type:String
    },
    deliveryStatus:{
        type:Boolean
    },
    orderId:{
        type:String,
        required:true
    },
    return:{
        type:Boolean
    },
    returnStatus:{
        type:String
    },
    returnReason:{
        type:String
    }
})






module.exports=mongoose.model("order",orderSchema,"order")