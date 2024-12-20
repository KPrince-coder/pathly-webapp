'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Benefits', href: '#benefits' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Pricing', href: '#pricing' },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  
  const headerBackground = useTransform(
    scrollY,
    [0, 50],
    ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
  );

  const headerBorderOpacity = useTransform(
    scrollY,
    [0, 50],
    [0, 0.1]
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <motion.header
        style={{ 
          background: headerBackground,
          borderColor: `rgba(0, 0, 0, ${headerBorderOpacity.get()})`,
        }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled ? 'backdrop-blur-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center cursor-pointer group"
              onClick={scrollToTop}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
              >
                <Image
                  src="/logo.svg"
                  alt="Pathly Logo"
                  width={40}
                  height={40}
                  className="mr-2"
                />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent
                group-hover:from-primary-600 group-hover:to-primary-800 transition-all duration-300">
                Pathly
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex items-center space-x-8"
            >
              {navigation.map((item, index) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  onClick={scrollToSection(item.href)}
                  className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200
                    relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 
                    after:bg-primary-500 after:origin-left after:scale-x-0 hover:after:scale-x-100
                    after:transition-transform after:duration-300"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ y: -2 }}
                >
                  {item.name}
                </motion.a>
              ))}
            </motion.nav>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:flex items-center space-x-4"
            >
              <Button
                variant="ghost"
                className="w-[120px] font-medium hover:text-primary-600 relative overflow-hidden group"
                onClick={() => window.location.href = '/login'}
              >
                <span className="relative z-10">Log in</span>
                <motion.div
                  className="absolute inset-0 bg-primary-50"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
              <Button
                className="w-[120px] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 
                  hover:to-primary-700 text-white font-medium relative overflow-hidden group"
                onClick={() => window.location.href = '/signup'}
              >
                <span className="relative z-10">Get Started</span>
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ x: '100%' }}
                  whileHover={{ x: '-100%' }}
                  transition={{ duration: 0.3 }}
                  style={{ opacity: 0.2 }}
                />
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <motion.div
                animate={isMobileMenuOpen ? "open" : "closed"}
                className="w-6 h-6 relative"
              >
                <motion.span
                  className="absolute h-0.5 w-6 bg-gray-600 transform"
                  variants={{
                    open: { rotate: 45, y: 8 },
                    closed: { rotate: 0, y: 0 }
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className="absolute h-0.5 w-6 bg-gray-600 top-2.5"
                  variants={{
                    open: { opacity: 0 },
                    closed: { opacity: 1 }
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className="absolute h-0.5 w-6 bg-gray-600 top-5"
                  variants={{
                    open: { rotate: -45, y: -8 },
                    closed: { rotate: 0, y: 0 }
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-0 right-0 bg-white z-40 border-b shadow-lg md:hidden"
          >
            <div className="px-4 py-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    onClick={scrollToSection(item.href)}
                    className="text-gray-600 hover:text-primary-600 font-medium py-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </nav>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full font-medium hover:text-primary-600"
                  onClick={() => window.location.href = '/login'}
                >
                  Log in
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 
                    hover:to-primary-700 text-white font-medium"
                  onClick={() => window.location.href = '/signup'}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
