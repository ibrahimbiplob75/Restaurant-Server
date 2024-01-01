const express=require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app=express();
const cors=require("cors");
const port=process.env.PORT || 5000;


// middleware
app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true,
}));
app.use(express.json());

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
    const userData=client.db("UsersDB").collection("Users")
    const Menudata=client.db("RestaurantDB").collection("menu");
    const Cartdata=client.db("RestaurantDB").collection("CartItems");


    app.post("/users",async(req,res)=>{
        const data=req.body;
        const query={email:data.email}
        const existedUser= await userData.findOne(query)
        if(existedUser){
          return res.send("User already exited", insertedId=null)
        }
        const result=await userData.insertOne(data)
        res.send(result)
    });
    app.get("/all/users",async(req,res)=>{
      const result=await userData.find().toArray();
        res.send(result);
    })
    app.get("/users",async(req,res)=>{
      const email=req.query.email;
      const query={email:email};
      const result=await userData.findOne(query)
      res.send(result);
    })
    app.delete("/users/:id",async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await userData.deleteOne(query);
      res.send(result);
    })

    //Client site data connections

    app.get("/menu",async(req,res)=>{
        const result=await Menudata.find().toArray();
        res.send(result);
    });



    app.get("/carts",async(req,res)=>{
        const email=req.query.email;
        const query={email:email};
        const result=await Cartdata.find(query).toArray();
        res.send(result);
    });
    app.post("/carts",async(req,res)=>{
      const cartItem=req.body;
      const result =await Cartdata.insertOne(cartItem);
      res.send(result);
    });
    app.delete("/carts/:id",async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)};
        const result=await Cartdata.deleteOne(query);
        res.send(result);
    })



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
