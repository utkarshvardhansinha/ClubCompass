require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: [
        "https://nitclubproj-1.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:5500"
    ],
    credentials: true,
}));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clubRoutes = require('./routes/clubRoutes');
const eventRoutes = require('./routes/eventRoutes');
const forumRoutes = require('./routes/forumRoutes');
const userFeaturesRoutes = require('./routes/userFeaturesRoutes');
const quizRoutes = require('./routes/quizRoutes');
const chatRoutes = require('./routes/chatRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', forumRoutes);
app.use('/api', userFeaturesRoutes); // profile, bookmarks, watchlist, reviews
app.use('/api/quiz', quizRoutes);
app.use('/api', chatRoutes); // dm, chat
app.use('/api/owner', ownerRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('NIT KKR Club Compass API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ detail: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 8001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
