/**
 * Primitivas visuales de FixMyPhone.
 * ===========================================================================
 *
 * Aqui no hay color, radio ni espaciado sueltos: todo sale de `tokens.css`.
 * Si necesitas un valor que no existe, primero se agrega al token, luego se
 * usa. Es la unica forma de que la app se vea como una sola pieza.
 *
 * NOTA SOBRE LA DOCTRINA: las primitivas son deliberadamente sobrias. Una
 * herramienta de taller no necesita tarjetas con degradado ni esquinas de
 * 16px. La densidad y el ritmo hacen el trabajo visual.
 */

import type { ReactNode, ButtonHTMLAttributes } from "react";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

/**
 * REGLA 1 (un acento por pantalla): `primary` reserva el naranja. Si dos
 * botones primary conviven en la misma vista, uno de los dos deberia ser
 * `secondary`. Es el error mas comun y el mas visible.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink hover:bg-brand-hover border border-transparent",
  secondary:
    "bg-surface-2 text-text hover:bg-surface-3 border border-border-strong",
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-2 border border-transparent",
  danger: "bg-transparent text-danger hover:bg-danger-subtle border border-danger/50",
};

const SIZES: Record<Size, string> = {
  // 32px: fila de herramienta, densa.
  sm: "h-8 px-3 text-small gap-1.5",
  // 36px: accion principal de una vista.
  md: "h-9 px-4 text-body gap-2",
};

export function Button({
  variant = "secondary",
  size = "sm",
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-[var(--motion-fast)] ease-[var(--motion-ease)]",
        "disabled:opacity-40 disabled:pointer-events-none select-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {/* REGLA: alineacion optica. El icono baja 1.5px respecto a la
          linea de texto; sin esto el par se ve " Casi" alineado. */}
      {icon ? <span className="optical-center">{icon}</span> : null}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-text-muted border-border-strong",
  brand: "bg-brand-subtle text-brand border-brand/40",
  success: "bg-success-subtle text-success border-success/40",
  warning: "bg-warning-subtle text-warning border-warning/40",
  danger: "bg-danger-subtle text-danger border-danger/40",
  info: "bg-info-subtle text-info border-info/40",
};

export function Badge({
  tone = "neutral",
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1.5 rounded-sm border",
        "px-1.5 py-0.5 text-caption font-medium leading-none",
        "whitespace-nowrap",
        TONES[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * REGLA 2: maximo 2 variantes de tarjeta por pantalla. `Panel` (con borde) y
 * `Panel-plano` (sin borde, solo separacion). Una tercera variante es
 * senal de que falta jerarquia.
 */
export function Panel({
  title,
  hint,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel flex min-h-0 flex-col ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 className="text-small font-semibold text-text">{title}</h2>
            {hint ? (
              <span className="truncate text-caption text-text-faint">{hint}</span>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// DataRow
// ---------------------------------------------------------------------------

/**
 * Una fila de dato tecnico. Altura fija (`min-height` en `.data-row`) para
 * que la columna no baile cuando los valores se actualizan en vivo: el
 * tecnico esta leyendo, no appreciates el Layout Shift.
 *
 * REGLA 5: el valor va en `.tech` (monoespaciada + cifras tabulares). El
 * campo de texto tecnico se ve arriba en minusculas; el dato, abajo y a la
 * derecha. Dos datos de la misma longitud deben ocupar lo mismo.
 */
export function DataRow({
  label,
  children,
  mono = true,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  tone?: "default" | "muted" | "danger" | "success" | "warning";
}) {
  const TONES = {
    default: "text-text",
    muted: "text-text-faint",
    danger: "text-danger",
    success: "text-success",
    warning: "text-warning",
  } as const;

  return (
    <div className="data-row">
      <span className="tech-label truncate" title={label}>
        {label}
      </span>
      <span
        className={`tech truncate ${mono ? "" : "font-sans"} ${TONES[tone]}`}
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

/**
 * Estado vacio. Nunca un icono grande centrado con un "No hay datos" generico:
 * dice que falta, por que, y que hacer. Esto es lo que separa una herramienta
 * de un formulario.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-start justify-center gap-3 p-8">
      {icon ? <div className="text-text-faint">{icon}</div> : null}
      <h3 className="text-h1 font-semibold text-text">{title}</h3>
      <p className="max-w-prose text-body text-text-muted">{body}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
