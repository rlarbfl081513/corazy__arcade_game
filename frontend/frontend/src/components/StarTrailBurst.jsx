// src/components/StarTrailBurst.jsx
import { useEffect, useRef, useState } from 'react'

export default function StarTrailBurst({ cursorSize, cursorX, cursorY, isClicking }) {
  const [burst, setBurst] = useState([])
  const rafId = useRef(null)

  useEffect(() => {
    const update = () => {
      setBurst(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.04,
          }))
          .filter(p => p.life > 0)
      )

      rafId.current = requestAnimationFrame(update)
    }

    rafId.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  useEffect(() => {
    if (!isClicking) return

    const angleOffset = Math.random() * 72
    const stars = []

    for (let i = 0; i < 5; i++) {
      const angle = angleOffset + i * 72
      const rad = angle * Math.PI / 180
      const speed = 7  // FIXED speed for same distance
      stars.push({
        x: cursorX,  // Center
        y: cursorY,
        vx: Math.cos(rad) * speed,
        vy: Math.sin(rad) * speed,
        life: 1,
      })
    }

    setBurst(prev => [...prev, ...stars])
  }, [isClicking, cursorX, cursorY])

  return (
    <>
      {burst.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            fontSize: '36px',
            opacity: p.life,
            transform: 'translate(40%, 20%)',
            pointerEvents: 'none',
            zIndex: 9998,
            color: '#fde047',
            filter: 'drop-shadow(0 0 3px #fde047)',
          }}
        >
          ★
        </div>
      ))}
    </>
  )
}