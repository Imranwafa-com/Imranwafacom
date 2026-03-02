import HeroSection from '../sections/HeroSection';
import FeaturedWork from '../sections/FeaturedWork';
import QuickAbout from '../sections/QuickAbout';
import PageTransition from '../components/PageTransition';

export default function HomePage() {
    return (
        <PageTransition>
            <div className="snap-y snap-mandatory h-screen overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
                <section className="snap-start min-h-screen">
                    <HeroSection />
                </section>
                <section className="snap-start min-h-screen flex items-center">
                    <div className="w-full">
                        <FeaturedWork />
                    </div>
                </section>
                <section className="snap-start min-h-screen flex items-center">
                    <div className="w-full">
                        <QuickAbout />
                    </div>
                </section>
            </div>
        </PageTransition>
    );
}
