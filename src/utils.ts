const createEmptyCoach = (): Coach => {
    return {
        totalSeats: 80,
        seatsPerRow: 7,
        reservedSeats: [],
    }
}

const createFilledCoach = (
    coach: Coach,
    fillingThresold: number = 0.45
): Coach => {
    const reservedSeats = []
    for (let i = 0; i < coach.totalSeats; i++) {
        const isReserved = Math.random() > fillingThresold
        if (isReserved) {
            reservedSeats.push(i)
        }
    }
    return { ...coach, reservedSeats }
}

const createSeatMap = (coach: Coach) => {
    const seatMap: Seat[][] = []
    if (!coach) {
        return seatMap
    }
    for (let i = 0; i < coach.totalSeats; i++) {
        if (i % coach.seatsPerRow === 0) {
            seatMap.push([])
        }
        const isReserved = coach.reservedSeats.includes(i)
        seatMap.at(-1)?.push({
            number: i,
            status: isReserved ? 'reserved' : 'available',
        })
    }
    return seatMap
}

export { createEmptyCoach, createFilledCoach, createSeatMap }
