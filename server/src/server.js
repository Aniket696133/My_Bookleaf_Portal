import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

await connectDB();
app.listen(env.port, () => console.log(`API listening on :${env.port} (AI ${env.anthropicKey ? 'enabled' : 'disabled'})`));
