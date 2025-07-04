const bcrypt = require('bcrypt');
bcrypt.hash('testpass', 10).then(console.log);