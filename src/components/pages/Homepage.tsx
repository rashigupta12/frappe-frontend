/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CheckCircle,
  Clock,
  Hammer,
  Mail,
  MapPin,
  Menu,
  Paintbrush,
  Phone,
  Settings,
  Shield,
  Star,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// TypeScript does not have BeforeInstallPromptEvent by default, so we declare it here
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState(0);
  console.log("Active Service Index:", activeService);
  const [isScrolled, setIsScrolled] = useState(false);

  // Simplified PWA installation state
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if app is already installed
  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const isInWebAppPwa = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppPwa) {
      setIsInstalled(true);
      console.log("App is already installed");
    }
  }, []);

  // Simplified beforeinstallprompt handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const event = e as BeforeInstallPromptEvent;
      console.log("beforeinstallprompt event fired");

      // Prevent the default browser install prompt
      event.preventDefault();

      // Store the event for later use
      setDeferredPrompt(event);

      // Show our custom install button only if not already installed
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      console.log("PWA was installed");
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Add event listeners
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  // Enhanced install handler
  const handleInstall = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      // Show iOS/Safari specific instructions
      const instructions = isIOS
        ? 'To install this app on iOS:\n\n1. Tap the Share button (□↗) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner'
        : 'To install this app:\n\n1. Click the Share button\n2. Select "Add to Home Screen"\n3. Click "Add"';

      alert(instructions);
      return;
    }

    if (!deferredPrompt) {
      console.log("No deferred prompt available");
      // Fallback for browsers that don't support the API
      alert(
        'To install this app:\n\nChrome/Edge: Look for the install icon in the address bar\nOr click the menu (⋮) > "Install app"'
      );
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      console.log("User choice outcome:", outcome);

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowInstallPrompt(false);
      } else {
        console.log("User dismissed the install prompt");
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Error during installation:", error);
    }
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const services = [
    {
      id: "joineries-wood-work",
      title: "Joineries & Woodwork",
      icon: <Hammer className="w-8 h-8" />,
      description:
        "Custom carpentry, furniture, doors, windows, and premium woodwork solutions",
      features: [
        "Custom Furniture",
        "Door & Window Installation",
        "Kitchen Cabinets",
        "Flooring Solutions",
      ],
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "painting-decorating",
      title: "Painting & Decorating",
      icon: <Paintbrush className="w-8 h-8" />,
      description:
        "Professional interior and exterior painting with premium finishes",
      features: [
        "Interior Painting",
        "Exterior Coating",
        "Decorative Finishes",
        "Wall Treatments",
      ],
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "electrical",
      title: "Electrical Services",
      icon: <Zap className="w-8 h-8" />,
      description:
        "Complete electrical installations, repairs, and maintenance solutions",
      features: [
        "Wiring & Rewiring",
        "Lighting Solutions",
        "Panel Upgrades",
        "Safety Inspections",
      ],
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "sanitary-plumbing",
      title: "Plumbing & Sanitary",
      icon: <Wrench className="w-8 h-8" />,
      description:
        "Expert plumbing, toilet, and washroom installation and maintenance",
      features: [
        "Bathroom Fitting",
        "Pipe Installation",
        "Leak Repairs",
        "Water Systems",
      ],
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "equipment-maintenance",
      title: "Equipment Installation & Maintenance",
      icon: <Settings className="w-8 h-8" />,
      description:
        "Professional equipment setup, installation, and ongoing maintenance",
      features: [
        "HVAC Systems",
        "Appliance Setup",
        "Preventive Maintenance",
        "Technical Support",
      ],
      color: "from-green-500 to-teal-600",
    },
  ];

  const stats = [
    { number: "500+", label: "Projects Completed" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "24/7", label: "Support Available" },
    { number: "10+", label: "Years Experience" },
  ];

  const testimonials = [
    {
      quote:
        "EITS transformed our kitchen with beautiful custom cabinets. Their attention to detail was impressive!",
      author: "Sarah Johnson",
      rating: 5,
    },
    {
      quote:
        "The electrical team was professional and efficient. They fixed all our wiring issues in one visit.",
      author: "Michael Chen",
      rating: 5,
    },
    {
      quote:
        "Our house painting was done on time and exactly as promised. Would definitely hire again.",
      author: "David Wilson",
      rating: 4,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % services.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  type ContactButtonProps = {
    variant?: "primary" | "secondary";
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  };

  const ContactButton: React.FC<ContactButtonProps> = ({
    variant = "primary",
    children,
    onClick,
    className = "",
  }) => (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg
        ${
          variant === "primary"
            ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:shadow-blue-500/25"
            : "bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );

  const handleContactClick = () => {
    const el = document.getElementById("contact-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCallClick = () => {
    window.location.href = "tel:+1234567890";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white shadow-md py-2"
            : "bg-white/90 backdrop-blur-md py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo section */}

            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <img
                    src="/logo.jpg"
                    alt="EITS Logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                  EITS Services
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#services"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Services
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Testimonials
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Contact
              </a>

              {/* Install Button */}
              {showInstallPrompt && !isInstalled && (
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                  title="Install EITS Services App"
                >
                  📱 Install App
                </button>
              )}

              <Link to="/dashboard">
                <button className="px-6 py-2 border border-emerald-500 text-black rounded-full font-semibold hover:bg-gradient-to-r from-emerald-500 to-blue-500 hover:text-white transition-opacity duration-300">
                  Dashboard
                </button>
              </Link>

              <Link to="/login">
                <button className="px-6 py-2 border border-emerald-500 text-black rounded-full font-semibold hover:bg-gradient-to-r from-emerald-500 to-blue-500 hover:text-white transition-opacity duration-300">
                  Login
                </button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#services"
                className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Services
              </a>
              <a
                href="#testimonials"
                className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Testimonials
              </a>
              <a
                href="#about"
                className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                className="block py-3 px-4 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Contact
              </a>

              <div className="pt-2 space-y-3">
                <Link to="/dashboard" className="block w-full">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity duration-300">
                    Dashboard
                  </button>
                </Link>

                <Link to="/login" className="block w-full">
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity duration-300">
                    Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:pt-40 sm:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
                Professional
              </span>
              <br />
              <span className="text-gray-800">Home Solutions</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              From woodwork to electrical, plumbing to painting - we're your
              trusted partner for all home improvement needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ContactButton onClick={handleContactClick}>
                Get Free Quote
              </ContactButton>
              <ContactButton variant="secondary" onClick={handleCallClick}>
                {" "}
                Call Now
              </ContactButton>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-16 px-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm sm:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Our Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive home solutions delivered by skilled professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 hover:border-transparent"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center text-white mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  {service.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  {service.description}
                </p>
                <ul className="space-y-2 mb-4 sm:mb-6">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-gray-700 text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleContactClick}
                  className="w-full py-2 sm:py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black transition-all duration-300 font-medium sm:font-semibold text-sm sm:text-base"
                >
                  Get Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Trusted by homeowners across the region
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 italic">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-gray-800 font-medium">
                  — {testimonial.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        id="about"
        className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose EITS?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Your satisfaction is our commitment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white text-center p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Shield className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                Quality Assured
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Premium materials and skilled craftsmanship guarantee lasting
                results
              </p>
            </div>
            <div className="bg-white text-center p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                On-Time Delivery
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                We respect your time and deliver projects as promised
              </p>
            </div>
            <div className="bg-white text-center p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Users className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                Expert Team
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Certified professionals with years of experience in their fields
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Need Expert Help With Your Home Project?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Our team is ready to assist you with any home improvement needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ContactButton onClick={handleContactClick}>
                Request Free Consultation
              </ContactButton>
              <ContactButton
                variant="secondary"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Phone className="mr-2 w-5 h-5" /> Call Now
              </ContactButton>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-section" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Contact Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Get in touch for a free quote or consultation
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 rounded-xl shadow-sm">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                Send us a message
              </h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your email"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-gray-700 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about your project"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-md"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Phone</h4>
                      <a
                        href="tel:+1234567890"
                        className="text-blue-600 hover:underline"
                      >
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">Email</h4>
                      <a
                        href="mailto:info@eitsservices.com"
                        className="text-blue-600 hover:underline"
                      >
                        info@eitsservices.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">
                        Service Area
                      </h4>
                      <p className="text-gray-600">
                        Your City & Surrounding Areas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 rounded-xl shadow-sm">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                  Business Hours
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Monday - Friday</span>
                    <span className="text-gray-600 font-medium">
                      8:00 AM - 6:00 PM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Saturday</span>
                    <span className="text-gray-600 font-medium">
                      9:00 AM - 4:00 PM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Sunday</span>
                    <span className="text-gray-600 font-medium">
                      Emergency Only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className="text-2xl font-bold">EITS Services</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                Professional home improvement services with quality
                craftsmanship and customer satisfaction.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                {services.slice(0, 3).map((service) => (
                  <li key={service.id}>
                    <a
                      href={`#${service.id}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Licenses
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>
              © {new Date().getFullYear()} EITS Services. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
