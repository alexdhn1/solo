import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { PracticalInfoSection } from '@/features/solo-booking/components/PracticalInfoSection'
import { MAP_LINKS } from '@/features/solo-booking/content'

describe('PracticalInfoSection', () => {
  it('renders the section with its heading and the postal address', () => {
    render(<PracticalInfoSection />)

    expect(screen.getByRole('heading', { name: /infos pratiques/i })).toBeInTheDocument()
    expect(screen.getByText('9 rue des Vendanges')).toBeInTheDocument()
    expect(screen.getByText('41400 Saint-Georges-sur-Cher')).toBeInTheDocument()
  })

  it('renders the three map links with the exact URLs and safe target attributes', () => {
    render(<PracticalInfoSection />)

    const expected = [
      [
        /google maps/i,
        'https://www.google.com/maps/search/?api=1&query=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher',
      ],
      [/apple plans/i, 'https://maps.apple.com/?q=9+rue+des+Vendanges+41400+Saint-Georges-sur-Cher'],
      [
        /waze/i,
        'https://waze.com/ul?q=9%20rue%20des%20Vendanges%2041400%20Saint-Georges-sur-Cher',
      ],
    ] as const

    expect(MAP_LINKS).toHaveLength(expected.length)

    for (const [name, href] of expected) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('mentions the travel information without inventing precise data', () => {
    render(<PracticalInfoSection />)

    expect(screen.getByText(/~2h de Paris en voiture/i)).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(<PracticalInfoSection />)

    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
