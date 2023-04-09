import express, { json, urlencoded } from 'express'
import { MongoClient, WithId } from 'mongodb'
import * as dotenv from 'dotenv'
import { bookTickets } from './src/bookingManager'
import cors, { CorsOptions } from 'cors'
import { createEmptyCoach, createFilledCoach } from './src/utils'
const app = express()

dotenv.config()

const PORT = process.env.PORT || 3000
const DATABASE_URI = process.env.DATABASE_URI || ''
const client = new MongoClient(DATABASE_URI)

client
    .connect()
    .then(() => {
        console.log('connected to db')
        app.listen(PORT, () => {
            console.log(`listening on port ${PORT}`)
        })
    })
    .catch((err) => console.log('failed to connect to db'))

const db = client.db('unstop')
const coaches = db.collection('coaches')

const whitelist = [
    'http://localhost:4200',
    'https://unstop-reservation.netlify.app',
]

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        if (origin && whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
}

app.use(cors(corsOptions))
app.use(json())
app.use(urlencoded({ extended: false }))

app.get('/coach', async (req, res) => {
    const doc = await coaches.findOne<WithId<Coach>>()

    res.json({
        status: 'success',
        coach: doc,
    }).status(200)
})

app.post('/book', async (req, res) => {
    if (!req.body || !req.body.seats) {
        res.json({ message: 'bad request' }).status(400)
        return
    }

    const { seats } = req.body
    const coachDoc = await coaches.findOne<Coach>({
        defaultCoach: true,
    })
    if (!coachDoc) {
        res.json({ status: 'failed', message: 'Unable to get coach' }).status(
            200
        )
        return
    }
    const availableSeats = coachDoc?.totalSeats - coachDoc?.reservedSeats.length
    if (availableSeats < seats) {
        res.json({
            status: 'failed',
            message: `${seats} seats are not available`,
        })
        return
    }
    if (coachDoc) {
        const { coachSeats, bookedSeats } = bookTickets(seats, coachDoc)
        const filter = { defaultCoach: true }
        const updateDoc = {
            $set: coachSeats,
        }
        await coaches.updateOne(filter, updateDoc)
        res.json({
            status: 'success',
            seatNumbers: bookedSeats,
            coach: coachSeats,
        })
    } else {
        res.json({ status: 'failed', seatNumbers: [], seatMap: [] })
    }
})

app.post('/reset', async (req, res) => {
    const emptyCoach = createEmptyCoach()
    const filter = { defaultCoach: true }
    const updateDoc = { $set: emptyCoach }
    await coaches.updateOne(filter, updateDoc)
    res.json({ status: 'success', coach: emptyCoach }).status(200)
})

app.post('/randomfill', async (req, res) => {
    const doc = await coaches.findOne<Coach>()
    if (!doc) {
        res.json({ message: 'Failed to auto fill' }).status(200)
        return
    }
    const autofilledCoach = createFilledCoach(doc)
    const filter = { defaultCoach: true }
    const updateDoc = { $set: autofilledCoach }
    await coaches.updateOne(filter, updateDoc)
    res.json({ status: 'success', coach: autofilledCoach }).status(200)
})
