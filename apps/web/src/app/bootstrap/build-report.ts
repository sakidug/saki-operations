/**
 * Thin re-exports so error reporting does not pull UI-only paths.
 */
export {
  environmentLabel,
  formatBuiltAtUtc,
} from '@saki-operations/build-info';
export { getClientBuildInfo } from '@/app/bootstrap/constants';
