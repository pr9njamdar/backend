const express = require("express");
const cors =require('cors')

const router = require("./Routes.js");

const PORT = process.env.PORT|| 5000;
const app = express();

app.use(express.urlencoded({extended:true}));
app.use(cors())
app.use('/',router)
app.use(express.json())

app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
  });

