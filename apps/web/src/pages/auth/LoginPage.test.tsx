import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { AuthContext } from '../../hooks/useAuth';
import { z } from 'zod';

describe('Login form validation', () => {
  it('renders email and password fields', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <AuthContext.Provider
          value={{
            user: null,
            loading: false,
            login: vi.fn(),
            logout: vi.fn(),
            has: () => false,
            hasRole: () => false,
          }}
        >
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});

describe('work item schema', () => {
  it('requires title and expected outcome', () => {
    const schema = z.object({
      title: z.string().min(3),
      expectedOutcome: z.string().min(8),
    });
    expect(schema.safeParse({ title: 'AB', expectedOutcome: 'ok' }).success).toBe(false);
    expect(schema.safeParse({ title: 'Onboard ABC', expectedOutcome: 'Complete onboarding' }).success).toBe(true);
  });
});
