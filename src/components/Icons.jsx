// Small outline icons (24px grid, 1.8 stroke). Decorative: always aria-hidden.
const P = {
  leaf: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14zm0 0c3-4 6-7 10-9',
  drop: 'M12 3.5c3.2 4 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0c0-3.2 2.3-6 5.5-10z',
  sprout: 'M12 20v-8m0 0c0-3.5-2.5-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5zm0 2c0-3 2.2-5 6-5 0 3-2.2 5-6 5z',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  smile: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14c1.9 2.2 5.1 2.2 7 0M9 9.5h.01M15 9.5h.01',
  layers: 'M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5zM3.5 12 12 16.5 20.5 12M3.5 16 12 20.5 20.5 16',
  cal: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM8 3.5V7M16 3.5V7M4 10.5h16',
  calr: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM8 3.5V7M16 3.5V7M4 10.5h16M8 15h3M13 15h3',
  spark: 'M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7L19 17z',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5',
  exit: 'M10 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h4M14.5 8 19 12l-4.5 4M19 12H9.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  target: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  chev: 'M6 9l6 6 6-6',
}
export default function Icon({ name, size = 20, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  )
}
