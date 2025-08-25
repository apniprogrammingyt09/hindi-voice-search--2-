"use client"

import { Mail, Phone, MapPin, Globe, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import Link from 'next/link'

interface FooterProps {
  variant?: 'landing' | 'dashboard'
}

export default function Footer({ variant = 'landing' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-gray-900 text-white ${variant === 'dashboard' ? 'mt-auto' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <h3 className="text-xl font-bold">NigamAI</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Revolutionizing municipal services through AI-powered voice assistance. 
              Making government services accessible, efficient, and citizen-friendly.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Help & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Municipal Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/services/water" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Water & Sanitation
                </Link>
              </li>
              <li>
                <Link href="/services/roads" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Roads & Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/services/health" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Health Services
                </Link>
              </li>
              <li>
                <Link href="/services/revenue" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Revenue & Taxation
                </Link>
              </li>
              <li>
                <Link href="/services/emergency" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Emergency Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p>Municipal Corporation</p>
                  <p>123 Government Street</p>
                  <p>Indore, MP 452001</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p>+91 731 2345678</p>
                  <p>Toll Free: 1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p>support@nigamai.gov.in</p>
                  <p>complaints@nigamai.gov.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p>www.nigamai.gov.in</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            <p>&copy; {currentYear} NigamAI - Municipal Corporation. All rights reserved.</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/accessibility" className="text-gray-400 hover:text-white transition-colors">
              Accessibility
            </Link>
            <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors">
              Sitemap
            </Link>
          </div>
        </div>

        {/* Government Badge */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🇮🇳</span>
              </div>
              <span className="text-gray-400 text-sm">Government of Madhya Pradesh</span>
            </div>
            <div className="text-gray-500 text-xs">
              Digital India Initiative | Make in India
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
