type BookingResponse = {
  status: "failure" | "success";
  seats?: number[];
  error?: string;
};

type Seat = {
  number: number;
  status: "reserved" | "available";
};

type Coach = {
  totalSeats: number;
  seatsPerRow: number;
  reservedSeats: number[];
};
