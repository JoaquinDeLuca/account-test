# Account – Actualización concurrente de saldo

Implementación NestJS + Prisma con SQLite.

> **Nota sobre tipos numéricos:**  
> Debido a las limitaciones de SQLite con tipos decimales, se utiliza `Float` para el campo `balance` (para fines prácticos en este ejercicio). En un entorno de producción se usaría un tipo `Decimal` (por ejemplo, en Postgres) para evitar problemas de precisión en operaciones monetarias.

## Modelo de datos

**Account**:

- `(id: String, balance: Float, version: Int, createdAt: DateTime, updatedAt: DateTime, transactions: Transaction[])`

**Transaction**:

- `(id: String, accountId: String, amountChange: Float, balance: Float, version: Int, type: String, createdAt: DateTime)`

Nota: `version` se usa para optimistic locking y `Transaction` funciona como log de cambios del saldo (trazabilidad).

## ¿Por qué NestJS?

NestJS ofrece una arquitectura modular y escalable, con una estructura definida que facilita que varios desarrolladores trabajen de forma ordenada y consistente. Incluye de forma nativa herramientas como validaciones, pipes y Swagger, lo que permite empezar rápido con buenas prácticas ya incorporadas y reducir deuda técnica desde el inicio.

## Pruebas bajo concurrencia

Se probaron escenarios con múltiples requests concurrentes (deposit/withdraw sobre la misma cuenta) usando scripts que disparan llamadas en paralelo, verificando que el saldo nunca quede negativo y que la suma de transacciones coincida con el balance final.

También se agregaron tests unitarios sobre el dominio (`AccountDomain`) usando Jest:

- `getSignedAmount`
  - Normaliza el signo según el tipo de operación (deposit/withdraw).
- `applyOperation`
  - Aplica la operación sobre el saldo.
  - Garantiza la regla de negocio de **no permitir saldo negativo** (lanza `BadRequestException` en caso de sobregiro).

## Resumen

- La función `updateBalance` (servicio) usa **optimistic locking** con un campo `version` para permitir múltiples actualizaciones concurrentes sin locks pesados en la base de datos. Cada operación lee la cuenta, calcula el nuevo saldo y solo actualiza si la versión coincide; si otro proceso modificó la cuenta primero, el `update` no afecta filas y se reintenta con backoff (delay calculado por intento). Esto garantiza consistencia sin estados intermedios inválidos.

- Las reglas de negocio como no permitir saldo negativo y normalizar el monto según el tipo de operación se delegan al dominio, manteniendo el servicio centrado en concurrencia y persistencia. Cada operación exitosa genera una transacción registrada para trazabilidad.

- Además, se definieron DTOs con validaciones (class-validator / pipes) para asegurar entradas correctas y evitar lógica defensiva dentro del servicio. Los endpoints están documentados con Swagger, lo que clarifica contratos, tipos y respuestas esperadas y ayuda a evitar deuda técnica futura.

## Retries y manejo de errores

- Hasta **6 intentos** con backoff (delay) + jitter para evitar choques de reintentos.
- Errores expuestos:
  - `400 BadRequest`: DTO inválido o intento de sobregiro detectado en dominio.
  - `404 NotFound`: cuenta inexistente.
  - `409 Conflict`: se agotaron los reintentos por alta contención.
  - `500 Internal`: fallo tras el último intento.

## Cómo ejecutar

- Requisitos:
  - Node + npm
- Variables de entorno (opcionales):
  - `DATABASE_URL` → default: `file:./dev.db`
  - `PORT` → default: `3000`

- Comandos básicos:
  - `npm install`
  - `npx prisma migrate dev` _(necesario la primera vez o cuando cambie el schema)_
  - `npm run start:dev`

- URLs por defecto:
  - App url base: [http://localhost:3000/api](http://localhost:3000/api)
  - Docs Swagger: [http://localhost:3000/docs](http://localhost:3000/docs)

- Tests:
  - Tests de dominio: `npm run test`
  - Test de concurrencia: `npx ts-node scripts/http-concurrency.ts`
