import express, { json, urlencoded } from 'express'
import { MongoClient, WithId } from 'mongodb'
import * as dotenv from 'dotenv'
import { bookTickets } from './src/bookingManager'
import cors from 'cors'
import { createEmptyCoach, createFilledCoach } from './src/utils'
const app = express()
const PORT = process.env.PORT || 3000

const coach: Seat[][] = []
for (let i = 0; i < 80; i++) {
    if (i % 7 === 0) {
        coach.push([])
    }
    coach.at(-1)?.push({ number: i + 1, status: 'available' })
}

dotenv.config()

const uri = process.env.DATABASE_URI || ''
const client = new MongoClient(uri)

client
    .connect()
    .then(() => {
        console.log('connected to db')
        app.listen(PORT, () => {
            console.log(`Example app listening on port ${PORT}`)
        })
    })
    .catch((err) => console.log('failed to connect to db'))

const db = client.db('unstop')

const coaches = db.collection('coaches')

app.use(cors())
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
