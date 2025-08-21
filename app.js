const express = require('express');
const connectDB = require('./db');
const camelcaseKeys = require('camelcase-keys'); // npm install camelcase-keys

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Función de asignación de asientos (básica por ahora)
function assignSeats(passengers, seats) {
  const groupedByPurchase = {};

  passengers.forEach(p => {
    if (!groupedByPurchase[p.purchaseId]) groupedByPurchase[p.purchaseId] = [];
    groupedByPurchase[p.purchaseId].push(p);
  });

  // Recorrer grupos y asignar
  for (const purchaseId in groupedByPurchase) {
    const group = groupedByPurchase[purchaseId];

    // ordenar por edad (para intentar ubicar menores primero con adultos)
    group.sort((a, b) => a.age - b.age);

    group.forEach(passenger => {
      // Buscar primer asiento libre del tipo correcto
      const seat = seats.find(s => !s.occupied && s.seatTypeId === passenger.seatTypeId);
      if (seat) {
        passenger.seatId = seat.seatId;
        seat.occupied = true;
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

    // 1️⃣ Query unificada: vuelo + boarding_pass + passenger + seat_type
    const [rows] = await db.query(
      `SELECT 
        f.flight_id, f.takeoff_date_time, f.takeoff_airport,
        f.landing_date_time, f.landing_airport, f.airplane_id,
        bp.boarding_pass_id, bp.purchase_id, bp.passenger_id,
        bp.seat_type_id, bp.seat_id,
        p.dni, p.name, p.age, p.country,
        st.name AS seat_type_name
       FROM flight f
       JOIN boarding_pass bp ON bp.flight_id = f.flight_id
       JOIN passenger p ON p.passenger_id = bp.passenger_id
       JOIN seat_type st ON st.seat_type_id = bp.seat_type_id
       WHERE f.flight_id = ?`,
      [flightId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, data: {} });
    }

    // 2️⃣ Armar objeto "vuelo"
    const flight = {
      flightId: rows[0].flight_id,
      takeoffDateTime: rows[0].takeoff_date_time,
      takeoffAirport: rows[0].takeoff_airport,
      landingDateTime: rows[0].landing_date_time,
      landingAirport: rows[0].landing_airport,
      airplaneId: rows[0].airplane_id
    };

    // 3️⃣ Pasajeros con boarding_pass
    const passengers = rows.map(r => ({
      passengerId: r.passenger_id,
      dni: r.dni,
      name: r.name,
      age: r.age,
      country: r.country,
      boardingPassId: r.boarding_pass_id,
      purchaseId: r.purchase_id,
      seatTypeId: r.seat_type_id,
      seatTypeName: r.seat_type_name,
      seatId: r.seat_id // puede ser null → se asigna después
    }));

    // 4️⃣ Traer asientos del avión
    const [seats] = await db.query(
      `SELECT seat_id, seat_row, seat_column, seat_type_id
       FROM seat
       WHERE airplane_id = ?
       ORDER BY seat_row, seat_column`,
      [flight.airplaneId]
    );

    // Preparar lista de asientos disponibles
    const seatList = seats.map(s => ({
      seatId: s.seat_id,
      seatRow: s.seat_row,
      seatColumn: s.seat_column,
      seatTypeId: s.seat_type_id,
      occupied: false
    }));

    // 5️⃣ Asignar asientos
    const passengersWithSeats = assignSeats(passengers, seatList);

    // 6️⃣ Transformar a camelCase
    const passengersCamel = passengersWithSeats.map(p => camelcaseKeys(p));

    // 7️⃣ Respuesta final
    res.json({
      code: 200,
      data: {
        ...flight,
        passengers: passengersCamel
      }
    });

  } catch (err) {
    console.error(err);
    res.status(400).json({ code: 400, errors: 'could not connect to db' });
  }
});

app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`));
