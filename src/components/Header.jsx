import './Header.css'

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

// Three slightly-overlapping circles in a triangle (apex on top). Each pair's
// intersection reads as a white seam: we draw one circle of the pair filled
// white but clipped to the other, so only the exact overlap lens shows.
const Logo = () => (
  <svg className="header__logo" viewBox="0 0 60 44" aria-hidden="true">
    <defs>
      <clipPath id="logo-top">
        <circle cx="30" cy="14" r="12" />
      </clipPath>
      <clipPath id="logo-left">
        <circle cx="20" cy="30" r="12" />
      </clipPath>
      <clipPath id="logo-right">
        <circle cx="40" cy="30" r="12" />
      </clipPath>
    </defs>
    <circle cx="30" cy="14" r="12" fill="#2D6A4F" />
    <circle cx="20" cy="30" r="12" fill="#C1121F" />
    <circle cx="40" cy="30" r="12" fill="#D4A017" />
    {/* White overlap seams = intersection of each circle pair. */}
    <g clipPath="url(#logo-left)">
      <circle cx="40" cy="30" r="12" fill="#FFFFFF" />
    </g>
    <g clipPath="url(#logo-top)">
      <circle cx="20" cy="30" r="12" fill="#FFFFFF" />
    </g>
    <g clipPath="url(#logo-top)">
      <circle cx="40" cy="30" r="12" fill="#FFFFFF" />
    </g>
  </svg>
)

const Header = ({ onMenuClick = () => {} }) => {
  return (
    <header className="header">
      <div className="header__inner">
        <a className="header__brand" href="/">
          <Logo />
          <span className="header__title">Flixster</span>
        </a>
        <button
          type="button"
          className="header__menu-btn"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  )
}

export default Header
