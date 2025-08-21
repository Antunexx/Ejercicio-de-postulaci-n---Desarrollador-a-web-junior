const express = require('express');
const connectDB = require('./db');
const camelcaseKeys = require('camelcase-keys');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function assignSeats(passengers, seats) {
  // En esta constante agrupamos los pasajeros por purchaseId
  // Esto es para que los pasajeros del mismo grupo se asignen asientos juntos
  const groupedByPurchase = {};
  passengers.forEach(p => {
    if (!groupedByPurchase[p.purchaseId]) groupedByPurchase[p.purchaseId] = [];
    groupedByPurchase[p.purchaseId].push(p);
  });

  for (const purchaseId in groupedByPurchase) {
    const group = groupedByPurchase[purchaseId];

    // la constante adults y minors agrupa a los mayores y menores de edad
    const adults = group.filter(p => p.age >= 18);
    const minors = group.filter(p => p.age < 18);

    // Se asignan a los adultos primero
    // y luego a los menores cerca de un adulto de su grupo
    adults.forEach(adult => {
      const seat = seats.find(s => !s.occupied && s.seatTypeId === adult.seatTypeId);
      if (seat) {
        adult.seatId = seat.seatId;
        seat.occupied = true;
        adult.assignedSeat = seat;
      }
    });
    minors.forEach(minor => {
      let seatAssigned = null;

      for (const adult of adults) {
        if (!adult.assignedSeat) continue;

        // Se busca un asiento libre cerca del adulto asignado
        seatAssigned = seats.find(s =>
          !s.occupied &&
          s.seatTypeId === minor.seatTypeId &&
          (s.seatRow === adult.assignedSeat.seatRow ||
           s.seatColumn === adult.assignedSeat.seatColumn)
        );

        if (seatAssigned) {
          break;
        }
      }

      // En caso de que no se haya encontrado un asiento cerca del adulto,
      // se busca cualquier asiento libre del tipo correspondiente
      if (!seatAssigned) {
        seatAssigned = seats.find(s => !s.occupied && s.seatTypeId === minor.seatTypeId);
      }

      if (seatAssigned) {
        minor.seatId = seatAssigned.seatId;
        seatAssigned.occupied = true;
        minor.assignedSeat = seatAssigned;
      }
    });

    // Cuando hay adultos sin asiento asignado,
    // se asignan los asientos restantes de su tipo
    adults.forEach(adult => {
      if (!adult.seatId) {
        const seat = seats.find(s => !s.occupied && s.seatTypeId === adult.seatTypeId);
        if (seat) {
          adult.seatId = seat.seatId;
          seat.occupied = true;
          adult.assignedSeat = seat;
        }
      }
    });
  }

  return passengers;
}


// Endpoint principal
app.get('/flights/:id/passengers', async (req, res) => {
  const flightId = req.params.id;

  // Unificamos toda la query
  try {
    const db = await connectDB();
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

    // Armamos primero el objeto vuelo 
    const flight = {
      flightId: rows[0].flight_id,
      takeoffDateTime: rows[0].takeoff_date_time,
      takeoffAirport: rows[0].takeoff_airport,
      landingDateTime: rows[0].landing_date_time,
      landingAirport: rows[0].landing_airport,
      airplaneId: rows[0].airplane_id
    };

    // Aca estan los pasajeros con unboarding pass
    // y sus datos asociados
    //seatId puede ser null si no tienen asiento asignado
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
      seatId: r.seat_id 
    }));

    // Trae los asientos del avion
    // y los ordena por fila y columna
    const [seats] = await db.query(
      `SELECT seat_id, seat_row, seat_column, seat_type_id
       FROM seat
       WHERE airplane_id = ?
       ORDER BY seat_row, seat_column`,
      [flight.airplaneId]
    );

    // Asientos disponibles
    const seatList = seats.map(s => ({
      seatId: s.seat_id,
      seatRow: s.seat_row,
      seatColumn: s.seat_column,
      seatTypeId: s.seat_type_id,
      occupied: false
    }));

    // Se asignan los asientos a los pasajeros
    // teniendo en cuenta las reglas de asignación
    const passengersWithSeats = assignSeats(passengers, seatList);

    // CamelCase
    const passengersCamel = passengersWithSeats.map(p => camelcaseKeys(p));

    // Salida final
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
