require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads')); 

const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const materialRoutes = require('./routes/materials');
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/modules', materialRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', progressRoutes);

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

db.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release();
  })
  .catch(error => {
    console.error('Error connecting to database:', error);
  });


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
