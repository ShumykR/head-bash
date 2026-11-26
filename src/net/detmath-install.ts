/**
 * Side-effect import: installs deterministic Math before anything else runs.
 * Must be the FIRST import of an entry point, because car and map modules
 * compute geometry with Math.sin/cos while they load.
 */
import { installDetMath } from './detmath';

installDetMath();
