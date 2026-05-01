const mysql = require('mysql2');
const passwords = ['', 'root', 'mysql', 'admin', 'password', '123456', 'root123'];
let found = false;
let checked = 0;
passwords.forEach(p => {
  const c = mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: p });
  c.connect(err => {
    checked++;
    if (!err) {
      found = true;
      console.log('>>> PASSWORD FOUND: [' + p + ']');
    }
    c.end();
    if (checked === passwords.length && !found) {
      console.log('None of the common passwords work. Please check MySQL Workbench for your root password.');
    }
  });
});
