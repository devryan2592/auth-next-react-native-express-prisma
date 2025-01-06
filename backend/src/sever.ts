import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from '@/middlewares/errorHandler';
import { rateLimiter } from '@/middlewares/ratelimiter';
import corsOptions from '@/config/cors/corsOptions';

const app: Express = express();

// Basic middlewares
app.use(rateLimiter);
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(errorHandler);

export default app;
