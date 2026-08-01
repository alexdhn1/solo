import { BackgroundLayer } from '@/features/solo-booking/components/BackgroundLayer'
import { BookingPanel } from '@/features/solo-booking/components/BookingPanel'
import { GroupSiteLink, PageHeader } from '@/features/solo-booking/components/PageHeader'
import { HeroSection } from '@/features/solo-booking/components/HeroSection'
import { PracticalInfoSection } from '@/features/solo-booking/components/PracticalInfoSection'
import { useSoloBooking } from '@/features/solo-booking/hooks/useSoloBooking'

function App() {
  const booking = useSoloBooking()

  return (
    <>
      <GroupSiteLink />
      <BackgroundLayer />
      <div className="relative z-[2] mx-auto max-w-[640px] px-4 py-8 pb-16">
        <PageHeader />
        <HeroSection />
        <BookingPanel
          weekends={booking.weekends}
          loading={booking.loading}
          loadError={booking.error}
          onRetry={() => void booking.refetch()}
          selectedRow={booking.selectedRow}
          onSelectRow={booking.setSelectedRow}
          onSubmit={booking.submit}
          submitting={booking.submitting}
          submitted={booking.submitted}
          onBookAnother={booking.reset}
          feedback={booking.feedback}
        />
        <PracticalInfoSection />
      </div>
    </>
  )
}

export default App
