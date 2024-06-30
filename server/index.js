const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const cookieParser = require('cookie-parser');
const database = require('./config/database');

const userRoutes = require('./routes/User');

const dotenv = require("dotenv");
dotenv.config();


const PORT = process.env.PORT || 4000;

// connect database
database.connect();

// middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// routes
app.use("/api/v1/auth",userRoutes);

app.listen(4000);