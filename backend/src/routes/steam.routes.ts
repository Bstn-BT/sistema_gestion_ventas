import { Router } from 'express';
import { buscarJuegosSteam } from '../controllers/steam.controller';

const router = Router();

router.get('/juegos', buscarJuegosSteam);

export default router;
