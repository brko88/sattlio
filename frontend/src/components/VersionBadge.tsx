const PHASE = __APP_VERSION__.includes("-beta")
  ? "Beta"
  : __APP_VERSION__.includes("-rc")
  ? "RC"
  : "";

function VersionBadge({ className = "text-slate-500" }: { className?: string }) {
  return (
    <p className={`px-3 mt-3 text-xs ${className}`}>
      Sattlio {PHASE} · v{__APP_VERSION__} · Build {__BUILD_DATE__}
    </p>
  );
}

export default VersionBadge;
