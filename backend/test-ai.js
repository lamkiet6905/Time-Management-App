const { parseTaskFromText } = require('./src/services/aiService'); 
require('dotenv').config(); 
parseTaskFromText('Tối nay học bài 2 tiếng').then(console.log).catch(console.error);
