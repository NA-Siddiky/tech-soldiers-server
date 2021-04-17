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

    const usersCollection = client.db("tech-soldiers").collection("users");
    const servicesCollection = client.db("tech-soldiers").collection("services");
    const orderCollection = client.db("tech-soldiers").collection("order");

    console.log("Database connected Successfully")

    app.get('/services', (req, res) => {
        servicesCollection.find().toArray((err, items) => {
            res.send([...items]);
        });
    });


    // Get Single Book By Id
    app.get('/checkout/:id', (req, res) => {
        const id = new ObjectId(req.params.id);
        servicesCollection.find({ _id: id }).toArray((err, items) => {
            res.send(items);
        });
    });


    app.post('/addUser', (req, res) => {
        const user = req.body;
        console.log(user)
        usersCollection.insertOne(user)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/addServices', (req, res) => {
        const newServices = req.body;
        console.log(newServices);
        servicesCollection.insertOne(newServices)
            .then((result) => {
                console.log('inserted count', result.insertedCount);
                res.send(result.insertedCount > 0);
            })
    })

    // save Order
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

});





app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});