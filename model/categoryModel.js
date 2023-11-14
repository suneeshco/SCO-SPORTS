const mongoose=require("mongoose")

const categorySchema=mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    list:{
        type:Boolean,
        required:true
    },
    discount:{
        type:Number
    },
    maxDiscount:{
        type:Number
    }
})

module.exports=mongoose.model("category",categorySchema,"category")