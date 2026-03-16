const express = require("express")
const { Resend } = require("resend")
require("dotenv").config()

const app = express()
const PORT = Number(process.env.PORT) || 3000
const REQUIRED_ENV_VARS = ["RESEND_API_KEY", "EMAIL_FROM", "ALERT_EMAIL_TO"]
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key])

let resend = null
const mailReady = missingEnvVars.length === 0

app.set("trust proxy", true)
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

    const { latitude, longitude } = req.body
    const ip = getClientIp(req)
    let resolvedLatitude = latitude
    let resolvedLongitude = longitude
    let locationSource = "browser-geolocation"
    let locationDetails = ""

    if (
        typeof resolvedLatitude !== "number" ||
        typeof resolvedLongitude !== "number"
    ) {
        const ipLocation = await lookupIpLocation(ip)

        if (!ipLocation) {
            return res.status(502).json({
                error: "Failed to determine visitor location."
            })
        }

        resolvedLatitude = ipLocation.latitude
        resolvedLongitude = ipLocation.longitude
        locationSource = "ip-fallback"
        locationDetails = formatLocationDetails(ipLocation)
    }

    const mail = {
        from: process.env.EMAIL_FROM,
        to: process.env.ALERT_EMAIL_TO,
        subject: "Visitor Alert",
        text: `New Visitor

IP: ${ip}
Location Source: ${locationSource}
Latitude: ${resolvedLatitude}
Longitude: ${resolvedLongitude}
${locationDetails ? `Approximate Area: ${locationDetails}\n` : ""}

Google Maps:
https://maps.google.com/?q=${resolvedLatitude},${resolvedLongitude}`,
        replyTo: process.env.ALERT_EMAIL_TO
    }

    try {
        console.log(
            `Preparing visitor alert: ip=${ip}, source=${locationSource}, ` +
            `latitude=${resolvedLatitude}, longitude=${resolvedLongitude}, ` +
            `area=${locationDetails || "n/a"}, to=${process.env.ALERT_EMAIL_TO}`
        )

        const { data, error } = await resend.emails.send(mail)

        if (error) {
            console.error(
                `Failed to send email: ip=${ip}, source=${locationSource}, ` +
                `to=${process.env.ALERT_EMAIL_TO}, error=${error.message}`
            )

            return res.status(502).json({
                error: "Failed to send email."
            })
        }

        console.log(
            `Visitor alert sent: id=${data?.id || "unknown"}, ip=${ip}, ` +
            `source=${locationSource}, to=${process.env.ALERT_EMAIL_TO}`
        )

        res.status(200).json({ message: "Sent" })
    } catch (error) {
        console.error(
            `Failed to send email: ip=${ip}, source=${locationSource}, ` +
            `to=${process.env.ALERT_EMAIL_TO}, error=${error.message}`
        )
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

function getClientIp(req) {
    const forwardedFor = req.headers["x-forwarded-for"]

    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
        return sanitizeIp(forwardedFor.split(",")[0].trim())
    }

    return sanitizeIp(req.ip || "unknown")
}

function sanitizeIp(value) {
    return value.replace(/^::ffff:/, "")
}

async function lookupIpLocation(ip) {
    if (!ip || ip === "unknown") {
        return null
    }

    try {
        const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`)

        if (!response.ok) {
            console.error(`IP lookup failed with status ${response.status}`)
            return null
        }

        const data = await response.json()

        const latitude = Number(data.latitude)
        const longitude = Number(data.longitude)

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            console.error("IP lookup did not return coordinates.")
            return null
        }

        return {
            latitude,
            longitude,
            city: data.city,
            region: data.region,
            country: data.country_name
        }
    } catch (error) {
        console.error("IP lookup failed:", error.message)
        return null
    }
}

function formatLocationDetails(location) {
    return [location.city, location.region, location.country]
        .filter(Boolean)
        .join(", ")
}
