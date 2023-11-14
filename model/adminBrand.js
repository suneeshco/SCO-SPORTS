const mongoose=require("mongoose")

const brandSchema=mongoose.Schema({
    brandName:{
        type:String,
        required:true
    },
    brandDescription:{
        type:String,
        required:true
    },
    list:{
        type:Boolean,
        required:true
    },
    image:{
        type:String,
        required:true
    }
})

module.exports=mongoose.model("brand",brandSchema,"brand")