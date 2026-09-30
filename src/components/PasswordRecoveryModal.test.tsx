import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';
import { jsonResponse, mockFetch } from '../test-utils';

describe('PasswordRecoveryModal (HU-003)', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('solicita el token y luego confirma la nueva contraseña', async () => {
    const fetchMock = mockFetch(
      jsonResponse(200, { message: 'Si el email está registrado, se generó un token de recuperación.' }),
      new Response(null, { status: 204 })
    );
    render(<PasswordRecoveryModal isOpen onClose={() => undefined} />);

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'paciente1@demo.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar token' }));

    await screen.findByText(/se generó un token de recuperación/);
    fireEvent.change(screen.getByLabelText('Token de recuperación'), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave2026*' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'NuevaClave2026*' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    await screen.findByText(/Tu contraseña fue actualizada/);
    const confirmBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(confirmBody).toEqual({ token: 'abc123', nuevaPassword: 'NuevaClave2026*' });
  });

  it('no envía la confirmación si las contraseñas no coinciden', async () => {
    const fetchMock = mockFetch();
    render(<PasswordRecoveryModal isOpen onClose={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un token' }));
    fireEvent.change(screen.getByLabelText('Token de recuperación'), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave2026*' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Distinta2026*' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('no coinciden'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('muestra el error del backend cuando el token no es válido', async () => {
    mockFetch(jsonResponse(400, { status: 400, error: 'Bad Request', message: 'Token inválido o expirado' }));
    render(<PasswordRecoveryModal isOpen onClose={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ya tengo un token' }));
    fireEvent.change(screen.getByLabelText('Token de recuperación'), { target: { value: 'malo' } });
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'NuevaClave2026*' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'NuevaClave2026*' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Token inválido o expirado')).toBeTruthy();
  });
});
