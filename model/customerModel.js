const mongoose=require("mongoose")
const productModel = require("./productModel")

const customerSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    address:[{
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
    }],
    cart:[{
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
    cartTotal:{
        type:Number
    },
    wishlist:[{
        productId:{
            type:mongoose.Types.ObjectId,
            ref:'product'
        },
        size:{
            type:Number
        }
    }],
    is_admin:{
        type:Number,
        required:true
    },
    status:{
        type:Boolean,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    wallet:{
        type:Number
    },
    transactionDetails:[{
        transactionId:{
            type:String
        },
        transactionType:{
            type:String
        },
        transactionAmount:{
            type:Number
        },
        transactionDate:{
            type:Date
        },
        orderId:{
            type:mongoose.Types.ObjectId
        }
    }
    ],
    referralCode:{
        type:String
    },
    usedReferral:{
        type:String
    },
    referralPurchase:{
        type:Boolean
    }
})

module.exports=mongoose.model("customer",customerSchema,"customer")