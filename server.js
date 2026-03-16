const express = require("express")
const nodemailer = require("nodemailer")
require("dotenv").config()

const app = express()
const PORT = Number(process.env.PORT) || 3000
const REQUIRED_ENV_VARS = ["EMAIL_USER", "EMAIL_PASS"]
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

let transporter = null
let mailReady = false

app.use(express.json())
app.use(express.static("public"))

app.get("/healthz", (req, res) => {
    const status = missingEnvVars.length === 0 && mailReady ? "ok" : "degraded"

    res.status(200).json({
        status,
        mailReady,
        missingEnvVars
    })
})

app.post("/send-location", async (req, res) => {
    if (!mailReady || !transporter) {
        return res.status(503).json({
            error: "Email service is not configured correctly."
        })
    }

    const { ip, latitude, longitude } = req.body

    if (
        typeof ip !== "string" ||
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {
        return res.status(400).json({
            error: "Request body must include ip, latitude, and longitude."
        })
    }

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
        res.status(200).json({ message: "Sent" })
    } catch (error) {
        console.error("Failed to send email:", error.message)
        res.status(502).json({
            error: "Failed to send email."
        })
    }
})

if (missingEnvVars.length === 0) {
    transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
    })

    transporter.verify()
        .then(() => {
            mailReady = true
            console.log("Mail transporter verified successfully.")
        })
        .catch((error) => {
            console.error("Mail transporter verification failed:", error.message)
        })
} else {
    console.warn(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    )
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
