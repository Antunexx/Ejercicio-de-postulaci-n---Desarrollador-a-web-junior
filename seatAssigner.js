// Asigna asientos a los pasajeros según reglas de grupo y tipo de asiento
function assignSeats(passengers, seats) {
  // Agrupa pasajeros por compra
  const groupedByPurchase = passengers.reduce((acc, p) => {
    acc[p.purchaseId] = acc[p.purchaseId] || [];
    acc[p.purchaseId].push(p);
    return acc;
  }, {});

  // Busca un asiento disponible de un tipo específico
  const findSeat = (typeId, occupiedSeats) =>
    seats.find(s => !occupiedSeats.has(s.seatId) && s.seatTypeId === typeId);

  // Asigna asientos primero a adultos, luego a menores cerca de adultos
  for (const purchaseId in groupedByPurchase) {
    const group = groupedByPurchase[purchaseId];
    const adults = group.filter(p => p.age >= 18);
    const minors = group.filter(p => p.age < 18);

    const occupiedSeats = new Set();

    // Asigna asientos a adultos
    adults.forEach(adult => {
      const seat = findSeat(adult.seatTypeId, occupiedSeats);
      if (seat) {
        adult.seatId = seat.seatId;
        adult.assignedSeat = seat;
        occupiedSeats.add(seat.seatId);
      }
    });

    // Asigna asientos a menores, intentando ubicarlos cerca de un adulto del grupo
    minors.forEach(minor => {
      let seatAssigned = null;
      for (const adult of adults) {
        if (!adult.assignedSeat) continue;
        seatAssigned = seats.find(s =>
          !occupiedSeats.has(s.seatId) &&
          s.seatTypeId === minor.seatTypeId &&
          (s.seatRow === adult.assignedSeat.seatRow || s.seatColumn === adult.assignedSeat.seatColumn)
        );
        if (seatAssigned) break;
      }
      // Si no hay asiento cercano, asigna cualquier asiento disponible del tipo
      if (!seatAssigned) seatAssigned = findSeat(minor.seatTypeId, occupiedSeats);
      if (seatAssigned) {
        minor.seatId = seatAssigned.seatId;
        minor.assignedSeat = seatAssigned;
        occupiedSeats.add(seatAssigned.seatId);
      }
    });
  }

  return passengers; // Devuelve la lista de pasajeros con asientos asignados
}

module.exports = assignSeats;
