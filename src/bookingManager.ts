import { createSeatMap } from './utils'

const canBookInSameRow = (seatsToBook: number, row: Seat[]) => {
    return (
        row.filter((seat) => seat.status === 'available').length >= seatsToBook
    )
}

const reserveSeatsInRow = (
    seatsToBook: number,
    row: Seat[]
): { reservedSeats: number[]; closeness: number } => {
    const continuosSeats: number[][] = []
    let i = 0
    while (i < row.length) {
        const seats: number[] = []
        while (i < row.length && row[i].status == 'available') {
            seats.push(row[i].number)
            i++
        }
        if (seats.length > 0) {
            continuosSeats.push(seats)
        }
        i++
    }
    continuosSeats.sort((groupA, groupB) => groupB.length - groupA.length)
    let bookedSeats: number[] = []
    let cost = 0
    for (let group of continuosSeats) {
        if (bookedSeats.length < seatsToBook) {
            bookedSeats = bookedSeats.concat(
                group.slice(0, Math.min(seatsToBook, group.length))
            )
            cost += 1
        }
    }
    return { reservedSeats: bookedSeats, closeness: cost }
}

/**
 * Tries to book seats in the same row, returns booked ticket
 * numbers if available else return null
 * @param seatsToBook number of seats to book
 * @param coachSeats current coach seats
 * @returns booked seats if successull otherwise null
 */
const tryBookingInSameRow = (
    seatsToBook: number,
    coachSeats: Seat[][]
): number[] | null => {
    if (seatsToBook <= 0) {
        return []
    }
    const seatsCopy = [...coachSeats]
    let bookedSeats: number[] = []
    let minCloseness = 10000
    for (let i = 0; i < seatsCopy.length; i++) {
        if (canBookInSameRow(seatsToBook, seatsCopy[i])) {
            const { reservedSeats, closeness } = reserveSeatsInRow(
                seatsToBook,
                seatsCopy[i]
            )
            if (closeness < minCloseness) {
                bookedSeats = reservedSeats
                minCloseness = closeness
            }
        }
    }
    return bookedSeats.length ? bookedSeats : null
}

const tryBookingInMultipleRows = (
    seatsToBook: number,
    coachSeats: Seat[][]
) => {
    const availableSeatsByRow = coachSeats.map((row) =>
        row
            .filter((seat) => seat.status === 'available')
            .map((seat) => seat.number)
            .flat()
    )
    let minRowDistance = 1000
    let bookedSeats: number[] = []
    for (let i = 0; i < availableSeatsByRow.length; i++) {
        let booked: number[] = []
        let rowDistance = 0
        const rowsBooked: number[] = []
        for (
            let j = i;
            j < availableSeatsByRow.length && booked.length < seatsToBook;
            j++
        ) {
            const row = availableSeatsByRow[j]
            const remaining = seatsToBook - booked.length
            const seats = row.slice(0, remaining)
            // console.log("row", row, seats, remaining, booked);
            booked = booked.concat(seats)
            if (seats.length > 0) {
                rowsBooked.push(j)
            }
        }
        for (let j = 1; j < rowsBooked.length; j++) {
            rowDistance += rowsBooked[j] - rowsBooked[j - 1]
        }
        if (rowDistance < minRowDistance && booked.length === seatsToBook) {
            minRowDistance = rowDistance
            bookedSeats = booked
        }
    }
    return bookedSeats
}

const bookTickets = (
    seatsToBook: number,
    coach: Coach
): { coachSeats: Coach; bookedSeats: number[] } => {
    const coachCopy = { ...coach }
    const coachSeats = createSeatMap(coach)
    const bookedSeats = tryBookingInSameRow(seatsToBook, coachSeats)
    if (bookedSeats) {
        return {
            coachSeats: {
                ...coach,
                reservedSeats: coachCopy.reservedSeats.concat(bookedSeats),
            },
            bookedSeats,
        }
    }
    const booked = tryBookingInMultipleRows(seatsToBook, coachSeats)
    if (booked) {
        return {
            coachSeats: {
                ...coach,
                reservedSeats: coachCopy.reservedSeats.concat(booked),
            },
            bookedSeats: booked,
        }
    }
    return { coachSeats: coach, bookedSeats: [] }
}

export { bookTickets }
