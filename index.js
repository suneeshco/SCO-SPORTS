const mongoose=require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/shopping")

const userRoute=require("./routes/userRoute")
const adminRoute=require("./routes/AdminRoute")

require('dotenv').config()

const port=process.env.PORT

const express= require("express")
const app= express()

app.use(express.urlencoded({extended:true}))
app.use(express.json());
app.use(express.static("public"))
app.use('/brand_images',express.static("brand_images"))

app.use("/",userRoute)
app.use("/",adminRoute)


app.listen(port,()=>{
    console.log("server running...")
})