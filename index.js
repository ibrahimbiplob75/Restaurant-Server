const express=require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app=express();
const cors=require("cors");
const stripe=require("stripe")(process.env.STRIPE_SECRET_KEY)
var jwt = require('jsonwebtoken');

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
    const OrderData=client.db("RestaurantDB").collection("orders");

    //Jwt api
    app.post("/jwt",async(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN , {
        expiresIn:"1hr"
      })
      console.log(token)
      res.send({token});
    })

    const verifyToken=(req,res,next)=>{
      
      if(!req.headers.authorization){
        return res.status(401).send({meassge:"Forbidden access"})
      }
      const token=req.headers.authorization.split(" ")[1]
      jwt.verify(token,process.env.ACCESS_TOKEN,(error,decoded)=>{
        if(error){
          return res.status(401).send({meassge:"Forbidden access"});
        }
        req.decoded=decoded;
        next();
      })
      
    }

    const verifyAdmin=async(req,res,next)=>{
   
      const email=req.decoded.email;
      const query={email:email}
      const user=await userData.findOne(query);
      const isAdmin=user?.role==="admin"
      if(!isAdmin){
        return res.status(403).send({meassge:"Unauthorized access"});
        
      }
      next();
      
      
    }
      
    

    //user api

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
    app.get("/all/users",verifyToken,verifyAdmin,async(req,res)=>{
      
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
    app.patch("/user/admin/:id",verifyToken,async(req,res)=>{
      const id=req.params.id;
      const filter={_id:new ObjectId(id)};
      const Updatedoc={
        $set:{
          role:"admin"
        }
      }
      const result = await userData.updateOne(filter, Updatedoc);
      res.send(result);
    });

    app.get("/users/admin/:email",verifyToken,async(req,res)=>{
        const email=req.params.email;
        if(email !== req.decoded.email){
          return res.status(403).send({meassge:"Unauthorized access"})
        }
        const query={email:email}
        const user=await userData.findOne(query)
        let isAdmin=false;
        if(user){
          isAdmin=user?.role==="admin"
        }
        //console.log(isAdmin);
        res.send({isAdmin})
    })

    //Client site data connections

    app.get("/menu",async(req,res)=>{
        const result=await Menudata.find().toArray();
        res.send(result);
    });

    app.post("/menu",verifyToken,verifyAdmin,async(req,res)=>{
      const data=req.body;
      const result=await Menudata.insertOne(data);
      res.send(result)
    });

    app.get("/menu/:id",async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await Menudata.findOne(query);
      res.send(result)
    });

    app.patch("/menu/:id",async(req,res)=>{
        const id=req.params.id;
        const update=req.body;
        const query={_id:new ObjectId(id)};
        const updateDoc = {
        $set: {
          name:update.name,
          category:update.category,
          price:update.price,
          recipe:update.recipe,
          image:update.image
          }
        }
      const result = await Menudata.updateOne(query, updateDoc);
      res.send(result)
    })

    app.delete("/menu/:id",async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const result=await Menudata.deleteOne(query);
      res.send(result);
    })



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
    });

    app.post("/create-payment-intent", async (req, res) => {
      const {price}=req.body;
      const amount=parseInt(price*100);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency: "usd",
        payment_method_types:["card"]
      });
      console.log(paymentIntent.client_secret)
      res.send({
      clientSecret: paymentIntent.client_secret,
      });

    });

    app.get("/payments/:email",verifyToken,async(req,res)=>{
      const email=req.params.email;
      if(req.params.email!==req.decoded.email){
        return res.status(403).send({meassge:"Unauthorized access"})
      }
      const query={email:email};
      const result=await OrderData.find(query).toArray();
      res.send(result);
    });
    

    app.post("/payments",verifyToken,async(req,res)=>{
        const data=req.body;
        const paymentResult=await OrderData.insertOne(data);
        
        const query={_id:{
          $in:data.cartItems.map(id=>new ObjectId(id))
        }}
        const DeleteResult=await Cartdata.deleteMany(query)
        res.send({DeleteResult,paymentResult});
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
