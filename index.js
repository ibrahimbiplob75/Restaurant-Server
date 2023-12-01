const express=require("express");
const app=express();
const cors=require("cors");
const port=process.env.PORT || 5000;


// middleware
app.get(cors());
app.get(express.json());



app.get("/",async(req,res)=>{
    res.send("Restuarant is serving now !!!!");
})

app.listen(port,async(req,res)=>{
    console.log(`server is running on port ${port}`);
})
