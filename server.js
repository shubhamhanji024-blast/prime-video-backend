require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { router: authRouter } = require('./routes/authRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');
const watchlistRouter = require('./routes/watchlistRoutes');
const movieCatalog = require('./data/movies');

// Initialize app
const app = express();

const seedData = require('./config/seeder');

// Connect Database
connectDB().then(() => {
  seedData();
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Basic route to check if API is alive
app.get('/', (req, res) => {
  res.send('Amazon Prime Video API is running...');
});

// Serve static Movie Catalog
app.get('/api/movies', (req, res) => {
  res.json(movieCatalog);
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api', subscriptionRouter);
app.use('/api', watchlistRouter);

// Error handling middleware for unregistered paths
app.use((req, res, next) => {
  res.status(404).json({ message: 'API Route Not Found' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in production/development mode on port ${PORT}`);
});
