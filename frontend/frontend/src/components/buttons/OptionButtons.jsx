import './OptionButtons.css';

export default function OptionButtons({ options, value, onChange }) {
  return (
    <div className="option-group">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`option-btn ${value === opt.name ? "is-selected" : ""}`}
          onClick={() => onChange(opt.name)}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}
