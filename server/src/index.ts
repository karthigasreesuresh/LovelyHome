import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import eldersRoutes from './routes/elders.routes';
import checkinsRoutes from './routes/checkins.routes';
import medicinesRoutes from './routes/medicines.routes';
import prescriptionsRoutes from './routes/prescriptions.routes';
import alertsRoutes from './routes/alerts.routes';
import sosRoutes from './routes/sos.routes';
import activityRoutes from './routes/activity.routes';
import dashboardRoutes from './routes/dashboard.routes';
import demoRoutes from './routes/demo.routes';
import { getMedicineLogsByElderId } from './controllers/medicines.controller';
import { authenticate } from './middleware/auth.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'LovelyHome Server API', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/elders', eldersRoutes);
app.use('/api/checkins', checkinsRoutes);
app.use('/api/medicines', medicinesRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/demo', demoRoutes);
app.get('/api/medicine-logs/:elderId', authenticate, getMedicineLogsByElderId);

// Error Handler Middleware
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 LovelyHome Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
