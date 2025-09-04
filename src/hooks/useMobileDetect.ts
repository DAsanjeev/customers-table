import { useEffect, useState } from 'react'

// Screen breakpoints
const MOBILE_BREAKPOINT = 767
const TABLET_BREAKPOINT = 1199

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Define media queries
    const mobileMediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    )
    const tabletMediaQuery = window.matchMedia(
      `(min-width: ${
        MOBILE_BREAKPOINT + 1
      }px) and (max-width: ${TABLET_BREAKPOINT}px)`
    )
    const desktopMediaQuery = window.matchMedia(
      `(min-width: ${TABLET_BREAKPOINT + 1}px)`
    )

    // Handlers for each media query change
    const handleMobileChange = (e: MediaQueryListEvent) =>
      setIsMobile(e.matches)
    const handleTabletChange = (e: MediaQueryListEvent) =>
      setIsTablet(e.matches)
    const handleDesktopChange = (e: MediaQueryListEvent) =>
      setIsDesktop(e.matches)

    // Initial check
    setIsMobile(mobileMediaQuery.matches)
    setIsTablet(tabletMediaQuery.matches)
    setIsDesktop(desktopMediaQuery.matches)

    // Attach event listeners for each media query
    mobileMediaQuery.addEventListener('change', handleMobileChange)
    tabletMediaQuery.addEventListener('change', handleTabletChange)
    desktopMediaQuery.addEventListener('change', handleDesktopChange)

    // Clean up event listeners on unmount
    return () => {
      mobileMediaQuery.removeEventListener('change', handleMobileChange)
      tabletMediaQuery.removeEventListener('change', handleTabletChange)
      desktopMediaQuery.removeEventListener('change', handleDesktopChange)
    }
  }, [])

  return { isMobile, isTablet, isDesktop }
}
