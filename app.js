const express = require('express');
const connectDB = require('./db');
const camelcaseKeys = require('camelcase-keys'); // npm install camelcase-keys

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Función para crear grilla de asientos del avión
function createSeatGrid(rows, cols, seats) {
  let grid = [];
  let k = 0;
  for (let i = 0; i < rows; i++) {
    let row = [];
    for (let j = 0; j < cols; j++) {
      if (k < seats.length) {
        row.push({ ...seats[k], occupied: false });
      } else {
        row.push(null);
      }
      k++;
    }
    grid.push(row);
  }
  return grid;
}

// Función de asignación de asientos
function assignSeats(passengers, seatGrid) {
  const groupedByPurchase = {};
  passengers.forEach(p => {
    if (!groupedByPurchase[p.purchase_id]) groupedByPurchase[p.purchase_id] = [];
    groupedByPurchase[p.purchase_id].push(p);
  });

  for (const purchaseId in groupedByPurchase) {
    const group = groupedByPurchase[purchaseId];
    // ordenar por edad: menores primero
    group.sort((a, b) => a.age - b.age);

    group.forEach(passenger => {
      for (let i = 0; i < seatGrid.length; i++) {
        for (let j = 0; j < seatGrid[i].length; j++) {
          const seat = seatGrid[i][j];
          if (seat && !seat.occupied && seat.seat_type_id === passenger.seat_type_id) {
            passenger.seat_id = seat.id;
            seat.occupied = true;
            break;
          }
        }
        if (passenger.seat_id) break;
      }
    });
  }

  return passengers;
}

// Endpoint principal
app.get('/flights/:id/passengers', async (req, res) => {
  const flightId = req.params.id;

  try {
    const db = await connectDB();

    // 1️⃣ Buscar vuelo
    const [flights] = await db.query('SELECT * FROM flights WHERE id = ?', [flightId]);
    if (flights.length === 0) return res.status(404).json({ code: 404, data: {} });

    const flight = flights[0];

    // 2️⃣ Traer pasajeros + boarding passes
    const [passengers] = await db.query(
      `SELECT p.id AS passenger_id, p.name, p.age, p.country,
              bp.id AS boarding_pass_id, bp.purchase_id, bp.seat_type_id, bp.seat_id
       FROM passengers p
       JOIN boarding_passes bp ON bp.passenger_id = p.id
       WHERE bp.flight_id = ?`,
      [flightId]
    );

    // 3️⃣ Traer asientos del avión
    const [seats] = await db.query(
      `SELECT id, seat_type_id FROM seats WHERE airplane_id = ? ORDER BY id`,
      [flight.airplane_id]
    );

    // 4️⃣ Crear grilla de asientos (ejemplo 6x6, ajustar según avión)
    const seatGrid = createSeatGrid(6, 6, seats);

    // 5️⃣ Asignar asientos
    const passengersWithSeats = assignSeats(passengers, seatGrid);

    // 6️⃣ Transformar a camelCase
    const passengersCamel = passengersWithSeats.map(p => camelcaseKeys(p));

    // 7️⃣ Respuesta final
    res.json({
      code: 200,
      data: {
        flightId: flight.id,
        takeoffDateTime: flight.takeoff_date_time,
        takeoffAirport: flight.takeoff_airport,
        landingDateTime: flight.landing_date_time,
        landingAirport: flight.landing_airport,
        airplaneId: flight.airplane_id,
        passengers: passengersCamel
      }
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ code: 400, errors: 'could not connect to db' });
  }
});

app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));
