const express = require("express");
const router = express.Router();
const Logistics = require("./MongoDb");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", (req, res) => {
  res.send("Ok Working");
});
router.post("/Register", (req, res) => {
  const { CompanyName, Password, CompanyAddress, UserType } = req.body;
  const NewLogistics = new Logistics({
    Type: UserType,
    CompanyName: CompanyName,
    Password: Password,
    CompanyAddress: CompanyAddress,
  });
  NewLogistics.save().then(() => {
    console.log("User saved");
  });
  res.send("recieved");
});

router.post("/Login", async (req, res) => {
  const { CompanyName, Password } = req.body;
  const doc = await Logistics.findOne({ CompanyName: CompanyName });

  if (doc) {
    if (doc.Password === Password) {
      res.send(JSON.stringify({ status: "ok", type: doc.Type }));
    } else {
      res.send("Password incorrect");
    }
  } else {
    res.send("no user found");
  }
});

router.get("/GetAllTransporters", async (req, res) => {
  const Tranporters = await Logistics.find(
    { Type: "Transporter" },
    { CompanyName: 1, _id: 0 }
  );

  res.send(Tranporters);
});

router.post("/SubmitOrder", async (req, res) => {
  // Check For transporter Code remaining

  await Logistics.findOneAndUpdate(
    { Type: "Transporter", CompanyName: req.query.Transporter },
    { $push: { Orders: req.body } },
    { new: true }
  );
  await Logistics.findOneAndUpdate(
    { CompanyName: req.body.Manufacturer },
    {
      $push: {
        Orders: {
          OrderID: req.body.OrderID,
          To: req.body.To,
          From: req.body.From,
          Quantity: req.body.Quantity,
          Address: req.body.Address,
          Transporter: req.query.Transporter,
        },
      },
    }
  );
  res.send("Order recieved");
});

router.get("/GetOrders", async (req, res) => {
  
  const doc = await Logistics.findOne({
    CompanyName: req.query.CompanyName,
  }).select("Orders.OrderID");
  res.send(doc.Orders);
});

router.get("/GetOrders/Id", async (req, res) => {
  const OrderDetail = await Logistics.aggregate([
    { $match: { CompanyName: req.query.CompanyName } },
    { $unwind: "$Orders" },
    { $match: { "Orders.OrderID": req.query.OrderID } },
    { $project: { _id: 0, Order: "$Orders" } },
  ]);

  if (req.query.GetPrice === "Yes") {
    const PriceObject = await Logistics.aggregate([
      { $match: { CompanyName: req.query.CompanyName } },
      { $unwind: "$Messages" },
      { $match: { "Messages.OrderID": req.query.OrderID } },
      { $project: { _id: 0, Order: "$Messages" } },
    ]);
    if (PriceObject.length > 0) {
      res.send({ ...OrderDetail[0].Order, ...PriceObject[0].Order });
    } else {
      res.send({ ...OrderDetail[0].Order, Price: "Not set" });
    }
  }

  if (req.query.GetPrice === "No") {
    const PriceObject = await Logistics.aggregate([
      { $match: { CompanyName: req.query.CompanyName } },
      { $unwind: "$Messages" },
      { $match: { "Messages.OrderID": req.query.OrderID } },
      { $project: { _id: 0, Order: "$Messages" } },
    ]);
    if (PriceObject.length > 0) {
      res.send({ ...OrderDetail[0].Order, ...PriceObject[0].Order });
    } else {
      res.send({ ...OrderDetail[0].Order, Confirmation: "No reply yet" });
    }
  } 
});

router.get("/Search/Order", async (req, res) => {
  const Orders = await Logistics.find(
    {
      CompanyName: req.query.CompanyName,
      "Orders.OrderID": { $regex: `.*${req.query.OrderID}.*`, $options: "i" },
    },
    { _id: 0 }
  );
  if (Orders[0]) {
    const orderIds = Orders[0].Orders.filter((order) =>
      order.OrderID.includes(req.query.OrderID)
    ).map((order) => order.OrderID);

    res.send(orderIds);
  } else {
    res.send("OrderNotFound");
  }
});

router.post("/Deal", async (req, res) => {
  const doc = await Logistics.findOneAndUpdate(
    { CompanyName: req.query.Manufacturer },
    { $push: { Messages: req.body } },
    { new: true }
  );

  res.send("Deal sent for confirmation");
});

router.post("/ConfirmOrder", async (req, res) => {
  await Logistics.findOneAndUpdate(
    { CompanyName: req.body.CompanyName },
    {
      $push: {
        Messages: {
          OrderID: req.body.OrderID,
          Confirmation: req.body.Confirmation,
          Price: req.body.Price,
        },
      },
    }
  );

  await Logistics.findOneAndUpdate({CompanyName:req.query.Manufacturer, "Messages.OrderID": req.body.OrderID },{ $set: { "Messages.$.Confirmation":req.body.Confirmation  } })
  res.send("order confirmed");
});

module.exports = router;
