const mongoose=require("mongoose")
require('dotenv').config()
mongoose.connect(`${process.env.MONGO_URL}`)

const userRoute=require("./routes/userRoute")
const adminRoute=require("./routes/AdminRoute")



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