const express = require("express");
const app = express();
const cors = require("cors");
const bcryptjs = require("bcryptjs")
const bodyParser = require("body-parser");
const cloudinary = require("cloudinary").v2;
require("dotenv").config()
app.use(bodyParser.urlencoded({ extended: true, limit: "1024mb" }))
app.use(bodyParser.json({ limit: "1024mb" }))
app.use(express.json());
app.use(cors({ origin: "*" }));

cloudinary.config({
    cloud_name: "dai67hb1x",
    api_key: "548458238141688",
    api_secret: "6YYctXR0LDPkWwBcC75_eyd-37M"
})




const URI = process.env.MONGO_URI

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    password: { type: String, trim: true, required: true },
})

userSchema.pre("save", function (next) {
    bcryptjs.hash(this.password, 15).then((hash) => {
        this.password = hash
        next()
    }).catch((err) => {
        console.log(err);
        next(err)
    })
})

let userModel = mongoose.models.user_tbs || mongoose.model("user_tbs", userSchema)

const productSchema = new mongoose.Schema({
    productImage: { type: String, trim: true, required: true },
    productName: { type: String, trim: true, required: true },
    productPrice: { type: Number, trim: true, required: true },
    productDescription: { type: String, trim: true, required: true },
    public_id: { type: String, trim: true, required: true }
})
let productModel = mongoose.models.products_tbs || mongoose.model("products_tbs", productSchema)

const cartSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    // quantity: { type: Number, trim: true },
    price: { type: Number, trim: true },
    image: { type: String, trim: true },
    // subTotal: { type: Number, trim: true },
    // phoneNumber: { type: String, trim: true },
    // paid: { type: Boolean, default: false },

})

let cartModel = mongoose.models.cart_tbs || mongoose.model("cart_tbs", cartSchema)

app.get("/", (request, response) => {
    return response.json({ message: "ram ram" });
});

app.post("/user/signup", async (req, res, next) => {
    try {
        await userModel.findOne({ email: req.body.email }).then((result) => {
            if (result) {
                res.status(409).send({ message: "email already exists", status: false })
            } else {
                let form = new userModel(req.body)
                form.save().then((result) => {
                    // console.log(result);
                    res.status(201).send({ message: "user created", status: true })
                }).catch((err) => {
                    console.log(err);
                    res.status(500).send({ message: "Signup failed", status: false })
                    return next(err)
                })
            }
        })
    } catch (error) {
        res.status(500).send({ message: "Internal server error", status: "false" })
        return next(error)
    }
})

app.post("/user/login", async (req, res, next) => {
    try {
        userModel.findOne({ email: req.body.email }).then((user) => {
            if (user) {
                bcryptjs.compare(req.body.password, user.password).then((result) => {
                    console.log(result);
                    if (result) {
                        res.status(200).send({ message: `Welcome ${user.firstName}`, data: { firstName: user.firstName, lastName: user.lastName, email: user.email }, status: true })
                    } else {
                        res.status(409).send({ messgae: "Invalid password", status: false })
                    }
                }).catch((err) => {
                    res.status(409).send({ messgae: "Internal server error", status: false })
                    return next(err)
                })
            } else {
                res.status(409).send({ message: "Invalid username", status: false })
            }
        })
    } catch (err) {
        res.status(500).send({ message: "Internal server error", status: "false" })
        return next(err)
    }
})

app.get("/user/viewproducts", (req, res, next) => {
    try {
        productModel.find().then((result) => {
            // console.log(result)
            res.status(200).send(result)
        })

    } catch (error) {
        res.status(500).send({ message: error.message, status: false })
        return next(error)
    }
})

app.post("/user/deleteitemfromcart", async (req, res, next) => {
    let myIndex = req.body
    let del = myIndex.id
    console.log(myIndex)
    try {
        await cartModel.findByIdAndDelete({ _id: del }).then((cart) => {
            console.log(cart);
            res.status(200).send({ message: "Item deleted successfully", status: true })
        })
    } catch (err) {
        res.status(500).send({ message: "internal server error", status: false })
        return next(err)
    }
})

app.post("/user/tocart", async (req, res, next) => {
    let product = req.body
    const cart = new cartModel(product)
    try {
        await userModel.findOne({ email: product.email }).then((user) => {
            if (!user) {
                res.status(401).send({ message: "user not found", status: false })
            } else {
                cart.save().then((result) => {
                    console.log(result);
                    res.status(201).send({ message: "product added to cart", status: true })
                }).catch((err) => {
                    console.log(err);
                    res.status(500).send({ message: "internal server error", status: false })
                    return next(err)
                })
            }
        })
    } catch (error) {
        console.log(error);
        res.status(501).send({ message: "internal server error", status: false })
        return next(error)
    }
})

app.post("/user/viewcart", async (req, res, next) => {
    console.log(req.body)
    try {
        await cartModel.find({ email: req.body.email }).then((cart) => {
            console.log(cart);
            res.status(200).send(cart)
        })
    } catch (error) {
        res.status(500).send({ message: "internal server error", status: false })
        return next(error)
    }
})


app.post("/admin/upload", async (req, res, next) => {
    const file = req.body.files
    try {
        console.log(req.body);
        await cloudinary.uploader.upload(file, (err, result) => {
            if (err) {
                console.log(err, 44);

                res.status(409).send({ message: "upload failed", status: false })
            } else {
                console.log(result);
                let product = new productModel({
                    productImage: result.secure_url,
                    public_id: result.public_id,
                    productDescription: req.body.description,
                    productPrice: req.body.price,
                    productName: req.body.productName
                })
                product.save().then((result) => {
                    console.log(result);
                    res.status(201).send({ message: "product uploaded", status: true })
                }).catch((err) => {
                    console.log(err);
                    res.status(500).send({ message: "upload failed", status: false })
                    return next(err)
                })
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: error.message, status: false })
        return next(error)
    }
})

app.post("/admin/viewproducts", async (req, res, next) => {

    try {
        productModel.find().then((result) => {
            if (result) {
                console.log(result)
                res.status(200).send(result)
            } else {
                res.status(404).send({ message: "No products found", status: false })
            }
        })

    } catch (error) {
        res.status(500).send({ message: error.message, status: false })
        return next(error)
    }
})

app.post("/admin/deleteproducts", (req, res, next) => {

    console.log(req.body);

    const _id = req.body.id
    const img = req.body.img
    try {
        productModel.findByIdAndDelete({ _id: _id }).then((result) => {
            console.log(result);
            if (result) {
                try {
                    cloudinary.uploader.destroy(img).then((ram) => {
                        if (ram.result == "ok") {
                            res.status(200).send({ message: "Deleted successfully", status: true })
                        } else {
                            res.status(404).send({ message: "Delete failed contact developer", status: false })
                        }

                    })
                } catch (err) {
                    console.log(err);
                }
            } else {
                res.status(404).send({ message: "Delete failed", status: false, no: 33 })
            }
        })
    } catch (error) {
        res.status(500).send({ message: error.message, status: false })
        return next(error)
    }
})







const connectDB = async () => {
    try {
        mongoose.set("strictQuery", false)
        await mongoose.connect(URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
    }
}

connectDB()

app.use((req, res, next) => {
    res.status(404).send({ status: "Route not found" })
    next()
})


app.listen(7000, () => {
    console.log(`App is listening to port 7000`);
})