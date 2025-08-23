# ✈️ Ejercicio de postulación - Desarrollador/a web junior

Este proyecto es una **API REST** para la gestión de vuelos, pasajeros y la **asignación automática de asientos**, desarrollado como ejercicio de postulación para **BSALE Chile**.

---

## 📦 Requisitos

- Node.js >= 14.x  
- npm >= 6.x

---

## ⚙️ Instalación

1. **Clona el repositorio:**
   ```sh
   git clone https://github.com/tu-usuario/Ejercicio-de-postulacion.git
   cd Ejercicio-de-postulacion


2. **Instala dependencias:**

    npm install


3. **Configura las variables de entorno:**

    Crea un archivo .env en la raíz del proyecto:

        DB_HOST=mdb-test.c6vunyturrl6.us-west-1.rds.amazonaws.com
        DB_USER=postulaciones
        DB_PASSWORD=post123456
        DB_NAME=airline
        DB_PORT=3306
        PORT=3000


▶️ Uso

1. **Inicia el servidor:**

    node app.js

El servidor escuchará en http://localhost:3000.


2. **Endpoint principal:**
    GET /flights/:id/passengers

 Donde :id es el ID del vuelo.



📂 Estructura del proyecto

    .
    ├── app.js             # Punto de entrada
    ├── db.js              # Configuración de la base de datos
    ├── flightService.js   # Consultas SQL y lógica de vuelos
    ├── seatAssigner.js    # Algoritmo de asignación de asientos
    ├── middleware/
    │   └── errorHandler.js
    ├── .env.example       # Variables de entorno de ejemplo
    └── README.md

📝 Licencia

Este proyecto es solo para fines de postulación y evaluación técnica.