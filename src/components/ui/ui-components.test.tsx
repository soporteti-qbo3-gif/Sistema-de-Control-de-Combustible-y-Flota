import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  CardSkeleton,
  PageHeader,
} from './index';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { Inbox, AlertTriangle } from 'lucide-react';

const ThemeTester: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <span data-testid="is-dark">{isDark ? 'true' : 'false'}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
};

describe('Componentes UI Compartidos', () => {
  describe('Button', () => {
    it('renderiza con variante primaria y maneja clicks', () => {
      const handleClick = vi.fn();
      render(
        <Button variant="primary" onClick={handleClick}>
          Guardar Cambios
        </Button>
      );
      const btn = screen.getByRole('button', { name: /Guardar Cambios/i });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('soporta estado de carga y deshabilita el click', () => {
      const handleClick = vi.fn();
      render(
        <Button loading={true} onClick={handleClick}>
          Enviando
        </Button>
      );
      const btn = screen.getByRole('button');
      expect(btn.hasAttribute('disabled')).toBe(true);
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('soporta variantes secondary, ghost y danger', () => {
      const { rerender } = render(<Button variant="secondary">Secundario</Button>);
      expect(screen.getByText('Secundario')).toBeDefined();

      rerender(<Button variant="ghost">Fantasma</Button>);
      expect(screen.getByText('Fantasma')).toBeDefined();

      rerender(<Button variant="danger">Eliminar</Button>);
      expect(screen.getByText('Eliminar')).toBeDefined();
    });
  });

  describe('Card & CardHeader', () => {
    it('renderiza Card con título y contenido', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Título Tarjeta</CardTitle>
            <CardDescription>Descripción breve</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Contenido interior</p>
          </CardContent>
          <CardFooter>
            <button>Acción</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Título Tarjeta')).toBeDefined();
      expect(screen.getByText('Descripción breve')).toBeDefined();
      expect(screen.getByText('Contenido interior')).toBeDefined();
      expect(screen.getByText('Acción')).toBeDefined();
    });
  });

  describe('Badge', () => {
    it('renderiza los estados de negocio con texto legible', () => {
      render(
        <div>
          <Badge variant="PENDIENTE">PENDIENTE</Badge>
          <Badge variant="APROBADA">APROBADA</Badge>
          <Badge variant="VALIDADO">VALIDADO</Badge>
          <Badge variant="RECHAZADO">RECHAZADO</Badge>
          <Badge variant="REQUIERE_REVISION">REQUIERE_REVISION</Badge>
          <Badge variant="ANOMALIA" dot>ANOMALÍA</Badge>
        </div>
      );

      expect(screen.getByText('PENDIENTE')).toBeDefined();
      expect(screen.getByText('APROBADA')).toBeDefined();
      expect(screen.getByText('VALIDADO')).toBeDefined();
      expect(screen.getByText('RECHAZADO')).toBeDefined();
      expect(screen.getByText('REQUIERE_REVISION')).toBeDefined();
      expect(screen.getByText('ANOMALÍA')).toBeDefined();
    });
  });

  describe('EmptyState', () => {
    it('muestra icono, título, descripción y botón de acción', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          icon={Inbox}
          title="Sin solicitudes"
          description="No hay registros pendientes de procesar."
          actionLabel="Crear Solicitud"
          onAction={onAction}
        />
      );

      expect(screen.getByText('Sin solicitudes')).toBeDefined();
      expect(screen.getByText('No hay registros pendientes de procesar.')).toBeDefined();
      const actionBtn = screen.getByRole('button', { name: /Crear Solicitud/i });
      fireEvent.click(actionBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('muestra mensaje claro y ejecuta onRetry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          title="Error en el servidor"
          message="No se pudieron sincronizar los datos de combustible."
          onRetry={onRetry}
          retryLabel="Reintentar ahora"
        />
      );

      expect(screen.getByText('Error en el servidor')).toBeDefined();
      expect(screen.getByText('No se pudieron sincronizar los datos de combustible.')).toBeDefined();
      const retryBtn = screen.getByRole('button', { name: /Reintentar ahora/i });
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Skeleton & CardSkeleton', () => {
    it('renderiza skeleton sin errores', () => {
      const { container } = render(
        <div>
          <Skeleton className="h-4 w-20" />
          <CardSkeleton rows={3} />
        </div>
      );
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('PageHeader', () => {
    it('renderiza título, subtítulo, badge y acciones', () => {
      render(
        <PageHeader
          title="Gestión de Flota"
          subtitle="Monitoreo de unidades activas y odómetros"
          badge={<Badge variant="APROBADA">Activo</Badge>}
          actions={<Button variant="primary">Nuevo Vehículo</Button>}
        />
      );

      expect(screen.getByText('Gestión de Flota')).toBeDefined();
      expect(screen.getByText('Monitoreo de unidades activas y odómetros')).toBeDefined();
      expect(screen.getByText('Activo')).toBeDefined();
      expect(screen.getByText('Nuevo Vehículo')).toBeDefined();
    });
  });

  describe('ThemeProvider & useTheme', () => {
    it('permite alternar el tema y persiste en localStorage', () => {
      localStorage.clear();
      render(
        <ThemeProvider>
          <ThemeTester />
        </ThemeProvider>
      );

      const val = screen.getByTestId('theme-val');
      const toggle = screen.getByTestId('toggle-btn');

      const initialTheme = val.textContent;
      fireEvent.click(toggle);
      const newTheme = val.textContent;

      expect(newTheme).not.toBe(initialTheme);
      expect(localStorage.getItem('flota_theme')).toBe(newTheme);
    });
  });
});
