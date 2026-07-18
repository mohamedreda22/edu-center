import mongoose from 'mongoose';
import { multiTenantPlugin } from '../../src/shared/mongoose/multiTenantPlugin.js';

// Guarantee that the global multi-tenant plugin is registered on Mongoose before any test suite loads or compiles schemas
mongoose.plugin(multiTenantPlugin);
