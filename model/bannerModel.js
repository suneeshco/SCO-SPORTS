const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    Discription:{
        type:String
    },

    status:{
        type:Boolean
    },

    Image: { 
        type: String
           
    },
    h1:{
    type:String
    },
    h2:{
        type:String
    },
    h3:{
        type:String
    },
    p1:{
        type:String
    }

})

module.exports = mongoose.model("banner", bannerSchema, "banner")