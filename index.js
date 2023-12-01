const express=require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app=express();
const cors=require("cors");
const port=process.env.PORT || 5000;


// middleware
app.get(cors());
app.get(express.json());

//RestaurantDB
//menu



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.npygsvo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const Menudata=client.db("RestaurantDB").collection("menu");


    //Client site data connections

    app.get("/menu",async(req,res)=>{
        const result=await Menudata.find().toArray();
        res.send(result);
    });



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get("/",async(req,res)=>{
    res.send("Restauarant is serving now !!!!");
})

app.listen(port,async(req,res)=>{
    console.log(`Restauarant server is running on port ${port}`);
})
