const express = require("express")
const { Resend } = require("resend")
require("dotenv").config()

const app = express()
const PORT = Number(process.env.PORT) || 3000
const REQUIRED_ENV_VARS = ["RESEND_API_KEY", "EMAIL_FROM", "ALERT_EMAIL_TO"]
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

let resend = null
const mailReady = missingEnvVars.length === 0

app.use(express.json())
app.use(express.static("public"))

app.get("/healthz", (req, res) => {
    const status = mailReady ? "ok" : "degraded"

    res.status(200).json({
        status,
        mailReady,
        missingEnvVars
    })
})

app.post("/send-location", async (req, res) => {
    if (!mailReady || !resend) {
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
        from: process.env.EMAIL_FROM,
        to: process.env.ALERT_EMAIL_TO,
        subject: "Visitor Alert",
        text: `New Visitor

IP: ${ip}
Latitude: ${latitude}
Longitude: ${longitude}

Google Maps:
https://maps.google.com/?q=${latitude},${longitude}`,
        replyTo: process.env.ALERT_EMAIL_TO
    }

    try {
        const { error } = await resend.emails.send(mail)

        if (error) {
            console.error("Failed to send email:", error.message)

            return res.status(502).json({
                error: "Failed to send email."
            })
        }

        res.status(200).json({ message: "Sent" })
    } catch (error) {
        console.error("Failed to send email:", error.message)
        res.status(502).json({
            error: "Failed to send email."
        })
    }
})

if (missingEnvVars.length === 0) {
    resend = new Resend(process.env.RESEND_API_KEY)
    console.log("Resend email client configured.")
} else {
    console.warn(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    )
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
