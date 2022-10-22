const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const route = require('../src/routes/route')
const mongoose = require('mongoose')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer().any())

mongoose.connect("mongodb+srv://RaviKumarSharma:i6tpVmiNCvIQSjH6@cluster0.pnzdn4a.mongodb.net/group-35-Database",{
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))


app.use('/', route)

app.listen(process.env.PORT || 3000 , function () {
    console.log('Express app running on port' + (process.env.PORT || 3000 ))
});