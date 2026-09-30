import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthShell } from './AuthShell';

const schema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password is required'),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'vinay.phadnis@solvian.local', password: 'Welcome123!' },
  });

  return (
    <AuthShell>
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
        <Typography variant="overline" color="primary">
          Solvian Group
        </Typography>
        <Typography variant="h5" fontWeight={750}>
          Digital Command Centre
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ mb: 0.75 }}>
        Welcome back
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        Sign in to see work, people and outcomes across the group.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form
        onSubmit={handleSubmit(async (values) => {
          setError('');
          try {
            await login(values.email, values.password);
            nav('/');
          } catch (e: any) {
            setError(e.response?.data?.message || 'Unable to sign in');
          }
        })}
      >
        <Stack spacing={2}>
          <TextField
            label="Email"
            autoComplete="username"
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} sx={{ py: 1.25 }}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
          <Link component={RouterLink} to="/forgot-password" underline="hover">
            Forgot password?
          </Link>
        </Stack>
      </form>
      <Accordion elevation={0} disableGutters sx={{ mt: 3, bgcolor: 'transparent', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0 }}>
          <Typography variant="body2" color="text.secondary">
            Demo accounts
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.7 }}>
            vinay.phadnis@solvian.local
            <br />
            sahil.phadnis@solvian.local
            <br />
            kunal.dhonge@solvian.local
            <br />
            admin@solvian.local
            <br />
            Password: Welcome123!
          </Typography>
        </AccordionDetails>
      </Accordion>
    </AuthShell>
  );
}
