export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="text-center">
          <p className="text-gray-600 text-xs sm:text-sm">
            Built with ❤️ for the SUST community
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © {new Date().getFullYear()} BloodConnect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
