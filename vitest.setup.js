import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project-id');
