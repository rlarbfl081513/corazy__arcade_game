import './RollingBanner.css';

export default function RollingBanner({
  text = 'ALGORITHM',
  speed = 15,
  gap = 10,
  bg = '#FFE27A',
  color = '#000',
  shadowColor = '#000',
  fontsize = 12,
}) {
  return (
    <div
      className="rollingword-wrap"
      style={{
        '--speed': `${speed}s`,
        '--gap': `${gap}px`,
        '--bg': bg,
        '--fg': color,
        '--shadow': shadowColor,
        '--fontsize':`${fontsize}px`
      }}
      aria-label="rolling-banner"
    >
      <div className="rollingword-track">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rollingword-seq" aria-hidden={i > 0}>
            {Array(20)
              .fill(text)
              .map((word, idx) => (
                <span key={idx} className="rollingword-item">
                  {word}
                </span>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
