const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ylija.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

client.connect(err => {

    console.log("Error is:", err)
    console.log("Database connected Successfully")

    // admin 
    const adminsCollection = client.db("tech-soldiers").collection("admin");

    app.get('/addAdmin/:email', async (req, res) => {
        const adminEmail = req.params.email
        const adminCreated = await adminsCollection.insertOne({ adminEmail });
        if (adminCreated.insertedCount > 0) {
            res.send(adminCreated.ops[0])
        }
    })

    //  users Section //

    const usersCollection = client.db("tech-soldiers").collection("users");

    app.get('/allusers', (req, res) => {
        usersCollection.find().toArray((err, items) => {
            res.send([...items]);
        });
    });

    app.get('/makeAdmin/:email', async (req, res) => {
        const email = req.params.email
        console.log(email)
        const data = await usersCollection.updateOne({ "email": email }, { $set: { "role": 'admin' } });
        res.send({ message: 'update Successfully' })
    });

    app.post('/addUser', async (req, res) => {
        const user = req.body;
        const { email } = user;
        usersCollection.findOne({ email }, (err, data) => {

            if (data) {
                const { isSignedIn, name, email, } = data;
                console.log(email)
                adminsCollection.findOne({ adminEmail: email }, (err, adminData) => {
                    if (adminData) {

                        const makeAdmin = async (email) => {
                            await usersCollection.updateOne({ "email": email }, { $set: { "role": 'admin' } })
                        }
                        makeAdmin(email);
                        const payload = {
                            isSignedIn,
                            name,
                            email,
                            role: "admin"
                        }
                        res.send(payload);
                    } else {
                        res.send(data);
                    }
                })

            } else {
                usersCollection.insertOne(user)
                    .then(result => {
                        if (result.insertedCount > 0) {
                            res.send(result.ops[0])
                        }
                    })
            }
        })
    })

    //  services Section //

    const servicesCollection = client.db("tech-soldiers").collection("services");

    app.get('/services', (req, res) => {
        servicesCollection.find().toArray((err, items) => {
            res.send([...items]);
        });
    });

    app.get('/checkout/:id', (req, res) => {
        const id = new ObjectId(req.params.id);
        servicesCollection.find({ _id: id }).toArray((err, items) => {
            res.send(items);
        });
    });

    app.post('/addServices', (req, res) => {
        const newServices = req.body;
        console.log(newServices);
        servicesCollection.insertOne(newServices)
            .then((result) => {
                console.log('inserted count', result.insertedCount);
                res.send(result.insertedCount > 0);
            })
    })

    // Delete Services

    app.get('/deleteService/:id', async (req, res) => {
        const id = new ObjectId(req.params.id);
        console.log(id)
        const deleteService = await servicesCollection.deleteOne({ _id: id });
        console.log(deleteService)
        if (deleteService.deletedCount > 0) {
            res.send({ message: 'Delete Successfully' })
        }
    })

    // Order Section    //

    const orderCollection = client.db("tech-soldiers").collection("order");

    app.post('/saveorder', (req, res) => {
        const newOrder = req.body;
        console.log(newOrder);
        orderCollection.insertOne(newOrder).then((result) => {
            console.log('inserted count', result.insertedCount);
            if (result.insertedCount > 0) {
                res.status(200).json(result);
            }
        });
    });

    app.get("/getOrders", (req, res) => {

        orderCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    app.get("/orderByEmail/:email", (req, res) => {
        const email = req.params.email
        orderCollection.find({ email: email }).toArray((err, documents) => {
            res.send(documents);
        });
    });

    // update order status 

    app.post('/orderStatus/:id', async (req, res) => {
        try {
            const id = new ObjectId(req.params.id);
            const { status } = req.body
            console.log(status)
            await orderCollection.updateOne({ _id: id }, { $set: { "status": status } });
            res.send({ message: 'Update Successfully ' });
        } catch (err) {
            res.send(err)
        }
    });

    //  reviews section //

    const reviewsCollection = client.db("tech-soldiers").collection("reviews");

    app.get("/getReviews", (req, res) => {
        reviewsCollection.find({}).toArray((err, documents) => {
            res.send(documents);
        });
    });

    app.post("/addReviews", (req, res) => {
        const field = req.body;
        reviewsCollection.insertMany(field).then(result => {
            res.send(result);
            console.log(result.insertedCount);
        });
    });

    app.post("/addSingleReview", (req, res) => {
        const NewReview = req.body;
        reviewsCollection.insertOne(NewReview).then(result => {
            res.send(result.ops[0]);
        });
    });

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});