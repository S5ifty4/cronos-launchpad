type ToggleRowProps = {
  label: string;
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
  disabled?: boolean;
  info?: string;
};

export function ToggleRow({ label, enabled = true, onChange, disabled = false, info }: ToggleRowProps) {
  return (
    <div className={`toggleRow ${disabled ? 'disabled' : ''}`}>
      <span className="toggleLabel">
        {label}
        {info && <span className="infoIcon" tabIndex={0} aria-label={`${label}: ${info}`}>i<span className="infoTooltip" role="tooltip">{info}</span></span>}
      </span>
      <label className="toggleControl" aria-label={label}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled || !onChange}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className={`toggleSwitch ${enabled ? 'on' : ''}`} aria-hidden="true" />
      </label>
    </div>
  );
}
