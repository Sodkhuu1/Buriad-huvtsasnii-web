import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import GalleryPreview from '../components/GalleryPreview'
import StatsSection from '../components/StatsSection'
import TestimonialsSection from '../components/TestimonialsSection'
import CallToAction from '../components/CallToAction'

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <GalleryPreview />
      <StatsSection />
      <TestimonialsSection />
      <CallToAction />
    </main>
  )
}
