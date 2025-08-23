require('dotenv').config(); // Carga variables de entorno desde .env
const express = require('express');
const assignSeats = require('./seatAssigner'); // Lógica de asignación de asientos
const { getFlightWithPassengers, getSeatsByAirplane } = require('./flightService'); // Servicios de vuelo y asientos
const errorHandler = require('./middleware/errorHandler'); // Middleware para manejo de errores

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Permite recibir JSON en las peticiones

// Endpoint para obtener pasajeros y asignarles asientos en un vuelo
app.get('/flights/:id/passengers', async (req, res, next) => {
  const flightId = parseInt(req.params.id);
  if (isNaN(flightId)) return res.status(400).json({ code: 400, message: 'Invalid flight ID' });

  try {
    // Obtiene información del vuelo y sus pasajeros
    const data = await getFlightWithPassengers(flightId);
    if (!data) return res.status(404).json({ code: 404, message: 'Flight not found' });

    // Obtiene los asientos disponibles para el avión
    const seats = await getSeatsByAirplane(data.flight.airplaneId);
    // Asigna asientos a los pasajeros
    const passengersWithSeats = assignSeats(data.passengers, seats);

    res.json({
      code: 200,
      data: {
        ...data.flight,
        passengers: passengersWithSeats
      }
    });
  } catch (err) {
    next(err); // Pasa el error al middleware de manejo de errores
  }
});

app.use(errorHandler); // Middleware para manejar errores globalmente

app.listen(PORT, () => console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`)); // Inicia el servidor
