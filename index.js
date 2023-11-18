const mongoose=require("mongoose")
mongoose.connect("mongodb+srv://suneeshcotkm:dcoE7k8JAPEgLfdG@scosportsdb.90xhjll.mongodb.net/shopping?retryWrites=true&w=majority")

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

app.use("/admin",adminRoute)
app.use("/",userRoute)


app.listen(port,()=>{
    console.log("server running...")
})