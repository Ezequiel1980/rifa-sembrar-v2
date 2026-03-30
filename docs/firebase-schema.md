# 🗄️ Esquema de Base de Datos — Firebase Firestore
## Proyecto: Sembrar Rifa

---

## Colecciones Principales

### 1. `users/{userId}`
Perfil de cada usuario registrado.

```
users/
  {userId}/
    uid: string           // Firebase Auth UID
    email: string
    displayName: string
    photoURL: string | null
    role: "admin" | "user"  // Control de acceso por rol
    createdAt: Timestamp
    updatedAt: Timestamp
```

---

### 2. `rifas/{rifaId}`
Documento central de cada rifa/sorteo.

```
rifas/
  {rifaId}/
    title: string              // "Rifa Navidad 2026"
    description: string
    totalNumbers: number       // 100 | 500 | 1000
    ticketPrice: number        // Precio por número (en pesos)
    currency: string           // "ARS" | "USD"
    status: "draft" | "active" | "drawing" | "closed"

    // Promociones
    promos: [
      {
        label: string          // "3x2", "Pack 5"
        quantity: number       // 3 (pagas)
        bonus: number          // 1 (gratis)
        active: boolean
      }
    ]

    // Pasarela de Pago
    payment: {
      mercadoPagoAlias: string
      mercadoPagoLink: string
      bankAlias: string
      instructions: string
    }

    // Resultado del Sorteo
    winner: {
      number: number | null
      userId: string | null
      userName: string | null
      drawnAt: Timestamp | null
    } | null

    // Metadatos
    imageURL: string | null
    createdBy: string          // Admin userId
    createdAt: Timestamp
    updatedAt: Timestamp
    drawDate: Timestamp | null
```

---

### 3. `rifas/{rifaId}/tickets/{ticketId}`
Subcolección: cada número vendido/reservado es un ticket.

```
rifas/{rifaId}/tickets/
  {ticketId}/
    number: number             // 1 — totalNumbers (ÚNICO, enforced por transaction)
    status: "reserved" | "paid" | "cancelled"

    userId: string             // Comprador
    userName: string
    userEmail: string
    userPhone: string | null

    // Datos de pago
    paymentMethod: string      // "mercado_pago" | "transferencia" | "efectivo"
    paymentRef: string | null  // Referencia/comprobante
    paidAt: Timestamp | null

    // Auditoría
    assignedBy: string | null  // Si un admin lo asignó manualmente
    notes: string | null       // Notas del admin
    createdAt: Timestamp
    updatedAt: Timestamp
```

**Índice requerido:** `(rifaId, number)` — garantiza unicidad con Firestore Transaction.

---

### 4. `rifas/{rifaId}/draws/{drawId}`
Historial de sorteos realizados (auditoría).

```
rifas/{rifaId}/draws/
  {drawId}/
    winnerNumber: number
    winnerUserId: string
    winnerUserName: string
    drawnAt: Timestamp
    drawnBy: string           // Admin que ejecutó el sorteo
    method: "random"          // Extensible a otros métodos
    totalSold: number         // Tickets pagados al momento del sorteo
    seed: string | null       // Para auditabilidad (hash aleatorio)
```

---

## Reglas de Seguridad (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones helper
    function isAuth() {
      return request.auth != null;
    }
    function isAdmin() {
      return isAuth() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    function isOwner(userId) {
      return isAuth() && request.auth.uid == userId;
    }

    // Users: lectura propia, escritura solo admin
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin();
      allow create: if isOwner(userId); // Registro inicial
    }

    // Rifas: lectura pública, escritura solo admin
    match /rifas/{rifaId} {
      allow read: if true;
      allow write: if isAdmin();

      // Tickets: lectura auth, creación user, edición admin
      match /tickets/{ticketId} {
        allow read: if isAuth();
        allow create: if isAuth(); // Controlado por Transaction en backend
        allow update: if isAdmin();
        allow delete: if isAdmin();
      }

      // Historial de sorteos: solo admin escribe
      match /draws/{drawId} {
        allow read: if isAuth();
        allow write: if isAdmin();
      }
    }
  }
}
```

---

## Diagrama de Relaciones

```
users/{uid}
    │
    └──► rifas/{rifaId}/tickets/{ticketId}  (1 user → N tickets)

rifas/{rifaId}
    ├──► tickets/{ticketId}   (subcolección)
    └──► draws/{drawId}       (subcolección — historial)
```

---

## Estrategia Anti-Duplicidad de Números

La integridad se garantiza con **Firestore Transactions**:

```javascript
// useRifa.js — reserveTicket()
const reserveTicket = async (rifaId, number, userData) => {
  const ticketRef = doc(db, `rifas/${rifaId}/tickets`, `num_${number}`);

  await runTransaction(db, async (transaction) => {
    const ticketSnap = await transaction.get(ticketRef);

    // ✅ Verificación atómica — si existe, lanza error
    if (ticketSnap.exists()) {
      throw new Error(`El número ${number} ya fue tomado.`);
    }

    transaction.set(ticketRef, {
      number,
      status: "reserved",
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
};
```

Usar el número como `ticketId` (`num_001`, `num_042`) garantiza que **Firestore rechaza escrituras duplicadas a nivel de documento**.
