import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrap } from '../../api/client';
import { AuthShell } from './AuthShell';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState('');

  return (
    <AuthShell>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Reset password
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We’ll send a reset link if this email is on the platform.
        </Typography>
        <Stack
          spacing={2}
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = unwrap<{ success: boolean; resetToken?: string }>(
              (await api.post('/auth/forgot-password', { email })).data,
            );
            setMsg('If the account exists, a reset link was issued.');
            if (res.resetToken) setToken(res.resetToken);
          }}
        >
          <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="contained">
            Send reset
          </Button>
          {msg && <Alert severity="success">{msg}</Alert>}
          {token && (
            <Alert severity="info">
              Dev token: <Link to={`/reset-password?token=${token}`}>reset password</Link>
            </Alert>
          )}
        </Stack>
        <Button component={Link} to="/login" sx={{ mt: 2 }}>
          Back to sign in
        </Button>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <AuthShell>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Choose a new password
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Use at least 10 characters.
        </Typography>
        <Stack
          spacing={2}
          component="form"
          onSubmit={async (e) => {
            e.preventDefault();
            await api.post('/auth/reset-password', { token, newPassword: password });
            setMsg('Password updated. You can sign in.');
          }}
        >
          <TextField
            label="New password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained">
            Update password
          </Button>
          {msg && <Alert severity="success">{msg}</Alert>}
          <Button component={Link} to="/login">
            Back to sign in
          </Button>
        </Stack>
    </AuthShell>
  );
}
