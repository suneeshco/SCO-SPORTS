const mongoose=require("mongoose")

const productSchema=mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    
    description:{
        type:String,
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    offerPrice:{
        type:Number,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        required:true
    },
    productDiscount:{
        type:Number
    },
    categoryDiscount:{
        type:Number
    },
    brand:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Types.ObjectId,
        ref:'category',
        required:true
    },
    images:[
        {
            url:{
                type:String
            }
        }
    ],
    list:{
        type:Boolean,
    },
    createdOn:{
        type:Date,
        required:true
    },
    updatedOn:{
        type:Date,
        required:true
    }
    
})

module.exports=mongoose.model("product",productSchema,"product")