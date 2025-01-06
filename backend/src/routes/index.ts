import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './auth.routes';
import { swaggerSpec } from '@/config/swagger/swagger.config';

const router = Router();

// Health check route
router.get('/health', (_, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
  });
});

// Swagger documentation
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation',
}));

// API routes
router.use('/auth', authRoutes);

export default router; 