import HeroSection from '../sections/HeroSection';
import FeaturedWork from '../sections/FeaturedWork';
import QuickAbout from '../sections/QuickAbout';
import PageTransition from '../components/PageTransition';

export default function HomePage() {
    return (
        <PageTransition>
            <div>
                <HeroSection />
                <FeaturedWork />
                <QuickAbout />
            </div>
        </PageTransition>
    );
}
