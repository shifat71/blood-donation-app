import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Heart, Search, Shield, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                Save Lives, Donate Blood
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-red-100">
                Connect with verified blood donors in the SUST community
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/donors" className="btn-primary bg-white text-red-600 hover:bg-gray-100 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                  Find Donors
                </Link>
                <Link href="/auth/signup" className="btn-secondary bg-red-800 text-white hover:bg-red-900 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2.5 sm:py-3">
                  Become a Donor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
              Why Choose BloodConnect?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-7 sm:h-8 w-7 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Verified Donors</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  All donors are verified through university email or manual verification
                </p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Search className="h-7 sm:h-8 w-7 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Easy Search</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Find donors by blood group and availability status quickly
                </p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Users className="h-7 sm:h-8 w-7 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Community Driven</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Built specifically for the SUST university community
                </p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Heart className="h-7 sm:h-8 w-7 sm:w-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">Save Lives</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Help save lives during emergencies by being available
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-12 sm:py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
              Ready to Make a Difference?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
              Join our community of blood donors and help save lives
            </p>
            <Link href="/auth/signup" className="btn-primary text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2.5 sm:py-3 inline-block">
              Get Started Today
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
