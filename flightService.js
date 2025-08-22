const db = require('./db');

// Obtiene información de un vuelo y sus pasajeros asociados
async function getFlightWithPassengers(flightId) {
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

  if (!rows.length) return null; // Si no hay resultados, retorna null

  // Estructura la información del vuelo
  const flight = {
    flightId: rows[0].flight_id,
    takeoffDateTime: rows[0].takeoff_date_time,
    takeoffAirport: rows[0].takeoff_airport,
    landingDateTime: rows[0].landing_date_time,
    landingAirport: rows[0].landing_airport,
    airplaneId: rows[0].airplane_id
  };

  // Estructura la información de los pasajeros
  const passengers = rows.map(({ passenger_id, dni, name, age, country, boarding_pass_id, purchase_id, seat_type_id, seat_type_name, seat_id }) => ({
    passengerId: passenger_id,
    dni,
    name,
    age,
    country,
    boardingPassId: boarding_pass_id,
    purchaseId: purchase_id,
    seatTypeId: seat_type_id,
    seatTypeName: seat_type_name,
    seatId: seat_id
  }));

  return { flight, passengers };
}

// Obtiene todos los asientos de un avión específico
async function getSeatsByAirplane(airplaneId) {
  const [rows] = await db.query(
    `SELECT seat_id, seat_row, seat_column, seat_type_id
     FROM seat
     WHERE airplane_id = ?
     ORDER BY seat_row, seat_column`,
    [airplaneId]
  );
  // Devuelve los asientos como objetos, marcados como no ocupados
  return rows.map(s => ({ ...s, occupied: false }));
}

module.exports = { getFlightWithPassengers, getSeatsByAirplane };
