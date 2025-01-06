import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { engine } from 'express-handlebars';
import path from 'path';
import { errorHandler } from '@/middlewares/errorHandler';
import { rateLimiter } from '@/middlewares/ratelimiter';
import corsOptions from '@/config/cors/corsOptions';
import router from '@/routes';

const app: Express = express();

// View engine setup
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'templates/layouts'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates'));

// Basic middlewares
app.use(rateLimiter);
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/v1', router);

// Main page route
app.get('/', (req, res) => {
  res.render('landing', {
    title: 'API Documentation',
    description: 'Modern Authentication System API'
  });
});

// Error handler
app.use(errorHandler);

export default app;
