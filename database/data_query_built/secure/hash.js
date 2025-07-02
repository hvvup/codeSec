const bcrypt = require('bcrypt');

bcrypt.hash('mypassword123', 10).then(hash => {
  console.log('Hashed password:', hash);
});
