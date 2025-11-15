const bcrypt = require('bcrypt');

const password = 'contraseña';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Hash:', hash);
  
  // Verificar contraseña
  bcrypt.compare(password, hash, (err, result) => {
    console.log('¿Coincide?', result);
  });
});