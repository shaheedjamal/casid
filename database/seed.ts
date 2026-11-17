import path from 'path';
import { seedDatabase } from './seed/seedData';

seedDatabase();
console.log('[DB] Seed complete.');
