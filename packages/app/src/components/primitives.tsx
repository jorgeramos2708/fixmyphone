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
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Copy } from "lucide-react";

// ---------------------------------------------------------------------------
// useCopiar
// ---------------------------------------------------------------------------

/** Lo que se está mostrando del último intento de copiar. */
export type EstadoCopia = "idle" | "ok" | "error";

/** El último intento de copiar, con la clave de lo que se copió. */
export type Copia = { clave: string; estado: "ok" | "error" };

/**
 * Copia al portapapeles y avisa durante un rato y medio.
 *
 * Vive aquí y no dentro de una pantalla porque hay tres sitios que copian: el
 * id del equipo, los bloques de comando de la licencia y las claves de variante
 * de la pantalla de equipo. Cuando eran tres y cada una por su cuenta, dos de
 * ellas mentían: ponían la palomita al instante, sin esperar a que la escritura
 * terminara, y sin mirar si había funcionado.
 *
 * Mentir aquí es peor que no tener botón. El técnico copia, ve la palomita,
 * pega en la terminal y ejecuta lo que ya había en el portapapeles de antes,
 * que puede ser otro comando completo. El error aflora en la terminal, no en la
 * app, y con un mensaje que parece de la herramienta.
 *
 * Por eso hay tres cosas que este hook no perdona:
 *
 *   1. La palomita solo sale cuando la escritura se resolvió. Antes se ponía
 *      antes de pedirse, así que un portapapeles bloqueado igualmente se
 *      sellaba como copiado.
 *   2. El fallo se dice, con el estado `error`. El silencio se lee como
 *      "todavía no lo intenté", y quien cree que copió un comando va a pegarlo.
 *   3. El aviso se apaga solo y el temporizador se cancela al desmontar. Con
 *      cuatro bloques en la misma pantalla, una palomita pegada deja al técnico
 *      sin saber cuál de los cuatro copió hace un rato.
 *
 * La `clave` es para las listas. Copiar la clave de una variante y que la
 * palomita aparezca en todas deja al técnico sin saber cuál de las N está
 * ahora en el portapapeles, que es justo lo que necesita saber para pegarla.
 * Quien no la necesite la deja vacía y compara solo el `estado`.
 */
export function useCopiar(): [Copia | null, (texto: string, clave?: string) => void] {
  const [copia, setCopia] = useState<Copia | null>(null);
  const aviso = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (aviso.current) clearTimeout(aviso.current);
    };
  }, []);

  const copiar = (texto: string, clave = "") => {
    const anotar = (estado: "ok" | "error") => {
      setCopia({ clave, estado });
      if (aviso.current) clearTimeout(aviso.current);
      aviso.current = setTimeout(() => setCopia(null), 1500);
    };

    // Si `navigator.clipboard` no existe, la cadena opcional devuelve `undefined`
    // sin lanzar. Sin este guardia se anotaría "ok" sin haber escrito nada.
    const escritura = navigator.clipboard?.writeText(texto);
    if (!escritura) {
      anotar("error");
      return;
    }
    escritura.then(() => anotar("ok")).catch(() => anotar("error"));
  };

  return [copia, copiar];
}

// ---------------------------------------------------------------------------
// BotonCopiar
// ---------------------------------------------------------------------------

/**
 * El botón de copiar, con su estado y su texto accesible.
 *
 * Vive aquí y no dentro de cada pantalla porque hay cuatro cosas que se copian
 * y cada copia del botón tenía su propia forma de callarse: el id del equipo,
 * los bloques de la licencia, las claves de variante y los literales de la
 * receta. Aquí hay una sola versión, y es la que no se inventa el resultado.
 *
 * `etiqueta` es el nombre de lo que se copia, con su artículo y su mayúscula
 * ("el comando de desbloqueo"). El estado se le añade al final y el estado en
 * reposo la baja a minúsculas detrás de "Copiar", que es como se lee bien.
 */
export function BotonCopiar({
  texto,
  etiqueta,
  className = "",
}: {
  texto: string;
  etiqueta: string;
  className?: string;
}) {
  const [copia, copiar] = useCopiar();

  const minuscula = etiqueta.charAt(0).toLowerCase() + etiqueta.slice(1);
  const accesible =
    copia?.estado === "ok"
      ? `${etiqueta}: copiado`
      : copia?.estado === "error"
        ? `${etiqueta}: no se pudo copiar`
        : `Copiar ${minuscula}`;

  return (
    <button
      type="button"
      onClick={() => copiar(texto)}
      className={["text-text-faint transition-colors hover:text-text", className].join(" ")}
      // El texto accesible cambia con el estado a propósito. Con un
      // `aria-label` fijo, quien usa lector de pantalla aprieta "Copiar" y no se
      // entera de si funcionó: el icono se vuelve palomita, y el icono no se
      // anuncia. Estos textos se copian para pegarlos en una terminal, así que
      // no saber si se copiaron es no saber si puede seguir.
      aria-label={accesible}
      title={accesible}
    >
      {copia?.estado === "ok" ? (
        <Check size={12} strokeWidth={2.5} className="text-success" />
      ) : copia?.estado === "error" ? (
        <AlertTriangle size={12} strokeWidth={2.5} className="text-danger" />
      ) : (
        <Copy size={12} strokeWidth={1.75} />
      )}
    </button>
  );
}

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
              <span
                className="truncate text-caption text-text-faint"
                title={typeof hint === "string" ? hint : undefined}
              >
                {hint}
              </span>
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
