import axios from 'axios';
import { AccountOperationType } from '../src/accounts/enums';

const BASE_URL = 'http://localhost:3000/api/accounts';

async function main() {
  // Crear cuenta
  const { data: account } = await axios.post(BASE_URL, {
    initialBalance: 1000,
  });

  console.log('Created account:', account);

  const operations = 50; // cantidad de operaciones concurrentes
  const withdrawAmount = 10;

  const promisesOperations = Array.from({ length: operations }).map((_) =>
    axios
      .patch(`${BASE_URL}/${account.id}`, {
        amount: withdrawAmount,
        type: AccountOperationType.WITHDRAW,
      })
      .then((res) => ({
        ok: true,
        data: res.data,
      }))
      .catch((err) => {
        // devolvemos los errores errores
        return {
          ok: false,
          status: err.response?.status,
          data: err.response?.data,
        };
      }),
  );

  const results = await Promise.all(promisesOperations);

  const successCount = results.filter((r) => r.ok).length;
  const conflictCount = results.filter(
    (r) => !r.ok && r.data.statusCode === 409,
  ).length;
  const badRequestCount = results.filter(
    (r) => !r.ok && r.data.statusCode === 400,
  ).length;

  console.log(`Total operations: ${operations}`);
  console.log(`Successful: ${successCount}`);
  console.log(`409 Conflict: ${conflictCount}`);
  console.log(`400 Bad Request: ${badRequestCount}`);

  // 3. Leer saldo final
  const { data: final } = await axios.get(`${BASE_URL}/${account.id}`);

  console.log('Final account state:', final);
}

main().catch((e) => {
  console.error('Error in test script:', e);
});
