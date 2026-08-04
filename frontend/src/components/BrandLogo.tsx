import { Link } from "react-router-dom";
import { BRAND } from "../config/landingConfig";

/**
 * BrandLogo — jedini izvor istine za "S" znak + Sattlio naziv.
 *
 * Do sada je ista oznaka bila kopirana ručno na Landing.tsx i Roadmap.tsx
 * (identičan markup) — spojeno ovdje da izmjena (npr. kad dizajner isporuči
 * pravi SVG logo, vidi raniji razgovor o brand fontu) ide na JEDNO mjesto.
 *
 * size="sm" — header trake (Landing, Roadmap)
 * size="lg" — samostalne stranice bez ostale navigacije (Login, Register)
 */
interface BrandLogoProps {
  size?: "sm" | "lg";
  /** Isključi na mjestima gdje link na početnu ne treba (npr. unutar kartice). */
  linkToHome?: boolean;
  className?: string;
}

function BrandMark({ size }: { size: "sm" | "lg" }) {
  const dims = size === "lg" ? "w-14 h-14 rounded-2xl text-xl" : "w-9 h-9 rounded-xl text-sm";
  return (
    <span
      className={`${dims} bg-blue-600 text-white flex items-center justify-center font-bold shrink-0`}
      aria-hidden="true"
    >
      S
    </span>
  );
}

/**
 * Naziv brenda sa jednim akcentom: SAMO slovo "i" (sa tačkom - isti znak, ista
 * boja se automatski primjeni na oboje) je plavo, ostatak ostaje sivo. Nalazi
 * PRVO "i" u BRAND.productName ("Sattlio") umjesto da tekst bude hardkodovan
 * ovdje - i dalje jedan izvor istine (landingConfig.ts) za sam naziv.
 */
function Wordmark({ size }: { size: "sm" | "lg" }) {
  const wordmarkClass = size === "lg" ? "text-2xl" : "text-lg";
  const name = BRAND.productName;
  const idx = name.indexOf("i");

  if (idx === -1) {
    return <span className={`font-bold text-slate-900 ${wordmarkClass}`}>{name}</span>;
  }

  return (
    <span className={`font-bold text-slate-900 ${wordmarkClass}`}>
      {name.slice(0, idx)}
      <span className="text-blue-600">i</span>
      {name.slice(idx + 1)}
    </span>
  );
}

function BrandLogo({ size = "sm", linkToHome = true, className = "" }: BrandLogoProps) {
  const content = (
    <>
      <BrandMark size={size} />
      <Wordmark size={size} />
    </>
  );

  if (!linkToHome) {
    return <span className={`flex items-center gap-2 ${className}`}>{content}</span>;
  }

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      {content}
    </Link>
  );
}

export default BrandLogo;
