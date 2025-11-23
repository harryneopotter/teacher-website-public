'use client'

import { useState, useEffect } from 'react'

// Extend Window interface for grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Heart, Sparkles, Users, PenTool, Star, Quote, FileText, Eye, Menu, X } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'

// Mobile PDF Viewer Component
interface Work {
  id: number;
  title: string;
  author: string;
  type: string;
  description: string;
  pdfUrl: string;
  thumbnailUrl: string;
  publishedDate: string;
}

function MobilePDFViewer({ work, index }: { work: Work; index: number }) {
  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="text-center pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {work.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">by {work.author}</p>
      </div>
      
      {/* PDF Preview Card */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-6">
        {/* Large PDF Icon */}
        <div className={`w-24 h-24 rounded-xl flex items-center justify-center ${
          index % 3 === 0 ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-800/50 dark:to-pink-800/50' :
          index % 3 === 1 ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-800/50 dark:to-indigo-800/50' :
          'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-800/50 dark:to-orange-800/50'
        }`}>
          <FileText className={`w-12 h-12 ${
            index % 3 === 0 ? 'text-purple-600 dark:text-purple-400' :
            index % 3 === 1 ? 'text-blue-600 dark:text-blue-400' :
            'text-orange-600 dark:text-orange-400'
          }`} />
        </div>
        
        {/* Content */}
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {work.description}
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-2">
              📱 Mobile Viewing
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
              Tap the button below to open this student work in your device&apos;s PDF viewer for the best reading experience.
            </p>
          </div>
          
          <Button 
            asChild 
            className={`w-full ${
              index % 3 === 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' :
              index % 3 === 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' :
              'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'
            } text-white shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <a 
              href={work.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>View PDF</span>
            </a>
          </Button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Published: {work.publishedDate} • {work.type}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    phone: '',
    program: '',
    comments: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as { opera?: string }).opera || ''
      const isMobileDevice = /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(userAgent)
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Load reCAPTCHA script
    if (typeof window !== 'undefined' && !window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_SITE_KEY`;
      script.async = true;
      document.head.appendChild(script);
    }
    
    return () => window.removeEventListener('resize', checkMobile)
  }, []) // studentWorks is not used in this effect, so no dependency needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      // Get reCAPTCHA token
      const captchaToken = await new Promise<string>((resolve, reject) => {
        if (typeof window !== 'undefined' && window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha!.execute('YOUR_RECAPTCHA_SITE_KEY', { action: 'submit' }).then(resolve).catch(reject);
          });
        } else {
          reject(new Error('reCAPTCHA not loaded'));
        }
      });

      // Submit form data
      const response = await fetch('/api/submit-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          captchaToken,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitMessage('Application submitted successfully! The teacher will contact you soon.');
        setFormData({ name: '', grade: '', phone: '', program: '', comments: '' });
      } else {
        setSubmitMessage(result.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const studentWorks = [
    {
      id: 1,
      title: "Creative Work 1",
      author: "Student Creative Work",
      type: "Creative Writing Collection",
      description: "A comprehensive creative writing collection showcasing imaginative storytelling and creative expression from one of our talented students.",
      pdfUrl: "/pdfs/Creative Work 1.pdf",
      thumbnailUrl: "/thumbnails/Creative Work 1.jpg",
      publishedDate: "August 2024"
    },
    {
      id: 2,
      title: "Student 1 Poem Portfolio",
      author: "Student 1",
      type: "Poetry Collection",
      description: "A beautiful collection of original poems exploring themes of nature, emotions, and imagination through the unique voice of young Student 1.",
      pdfUrl: "/pdfs/Student 1 poem portfolio.pdf",
      thumbnailUrl: "/thumbnails/Student 1 poem portfolio.jpg",
      publishedDate: "August 2024"
    },
    {
      id: 3,
      title: "Student 2 Poem Portfolio",
      author: "Student 2",
      type: "Poetry Collection",
      description: "An inspiring portfolio of poems that showcase Student 2&apos;s growing confidence in creative expression and poetic voice.",
      pdfUrl: "/pdfs/Student 2 poem portfolio.pdf",
      thumbnailUrl: "/thumbnails/Student 2 poem portfolio.jpg",
      publishedDate: "August 2024"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 transition-colors duration-300">
      {/* Floating Navigation */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full px-8 py-3 shadow-lg border border-purple-100 dark:border-purple-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 mr-2 pr-2 border-r border-purple-200 dark:border-purple-700">
            <Image
              src="/api/logo"
              alt="The Creative Writing Program Logo"
              width={32}
              height={32}
              className="object-contain w-8 h-8"
            />
            <span className="text-purple-800 dark:text-purple-200 font-bold text-sm transition-colors">The Teacher&apos;s Program</span>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#about" className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors">About</a>
            <a href="#vision" className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors">Vision</a>
            <a href="#program" className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors">Program</a>
            <a href="#apply" className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors">Apply</a>
            <a href="#showcase" className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors">Showcase</a>
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
          <div className="ml-2 pl-2 border-l border-purple-200 dark:border-purple-700">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 dark:border-purple-800 md:hidden">
            <div className="flex flex-col space-y-2 p-4">
              <a
                href="#about"
                className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#vision"
                className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Vision
              </a>
              <a
                href="#program"
                className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Program
              </a>
              <a
                href="#apply"
                className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Apply
              </a>
              <a
                href="#showcase"
                className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 font-medium transition-colors py-2 px-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Showcase
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Asymmetric Layout */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-200 rounded-full opacity-60"></div>
                <div className="absolute top-8 right-8 w-16 h-16 bg-pink-200 rounded-full opacity-60"></div>
                
                {/* Brand Logo */}
                <div className="flex items-center space-x-4 mb-6 relative z-10">
                  <Image
                    src="/api/logo"
                    alt="The Creative Writing Program Logo"
                    width={128}
                    height={128}
                    className="object-contain w-32 h-32"
                  />
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-300 transition-colors duration-300">The Teacher</h3>
                    <p className="text-lg text-purple-600 dark:text-purple-400 font-medium transition-colors duration-300">Creative Writing Program</p>
                  </div>
                </div>
                
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-800 dark:text-gray-100 leading-tight relative z-10 transition-colors duration-300">
                  Every Child Has a 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"> Story</span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mt-6 max-w-2xl transition-colors duration-300">
                  Welcome to The Teacher&apos;s Creative Writing Program - where young minds discover the magic of words and the power of imagination.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-all duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                  <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4 transition-colors duration-300" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Creative Writing Program</h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">For Grades 4-7 • Ages 9-12</p>
                  <div className="mt-4 flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About The Teacher - Curved Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-800 dark:via-purple-900/30 dark:to-gray-800 rounded-b-[100px] transition-colors duration-300"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-purple-100 dark:bg-purple-800/50 rounded-full px-4 py-2 mb-6 transition-colors duration-300">
                <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                <span className="text-purple-700 dark:text-purple-300 font-medium transition-colors duration-300">Meet Your Teacher</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">The Teacher</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">
                An experienced English teacher passionate about nurturing young writers. I believe that every child has a unique voice waiting to be discovered through the magic of creative writing.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Specialized in Creative Writing for Children</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Focus on Building Confidence & Voice</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Small Batch Teaching for Personal Attention</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-800/30 dark:to-orange-800/30 rounded-3xl p-8 transform -rotate-2 transition-colors duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                  <Quote className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4 transition-colors duration-300" />
                  <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed transition-colors duration-300">
                    &ldquo;Writing is not just about putting words on paper. It&apos;s about discovering who you are, what you think, and how you see the world.&rdquo;
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold mt-4 transition-colors duration-300">- The Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section - Diagonal Layout */}
      <section id="vision" className="py-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 relative transition-colors duration-300">
        <div className="absolute inset-0 bg-white dark:bg-gray-900 transform -skew-y-2 origin-top-left transition-colors duration-300"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-200 dark:bg-purple-800/50 rounded-full px-6 py-3 mb-6 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-300 transition-colors duration-300" />
              <span className="text-purple-800 dark:text-purple-200 font-semibold transition-colors duration-300">Our Vision</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">Building Confidence Through Creativity</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
              This program is not just about writing; it&apos;s about building confidence, finding a voice, and celebrating creativity. 
              Students don&apos;t just learn the mechanics of writing; they discover the creativity, courage, and joy of expressing themselves.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800 dark:text-gray-100 transition-colors duration-300">Creative Expression</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Explore poetry, stories, and scripts while experimenting with different voices and styles.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform translate-y-4">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800 dark:text-gray-100 transition-colors duration-300">Collaborative Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Share and showcase creative projects while building teamwork and peer feedback skills.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800 dark:text-gray-100 transition-colors duration-300">Confident Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Develop strong writing & grammar skills while becoming confident communicators.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Details - Zigzag Layout */}
      <section id="program" className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">Young Voices Creative Writing Program</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors duration-300">Unlock Your Imagination – Write, Create, Share!</p>
          </div>

          <div className="space-y-20">
            {/* Program Feature 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">What We Do</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">Explore poetry, stories, and scripts</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex-shrink-0 mt-1"></div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">Experiment with different voices and styles</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 transition-colors duration-300">Share and showcase creative projects</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/50 dark:to-pink-800/50 rounded-3xl p-8 transform rotate-2 transition-colors duration-300">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                    <BookOpen className="w-16 h-16 text-purple-600 dark:text-purple-400 mb-4 transition-colors duration-300" />
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Creative Exploration</h4>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Students dive deep into various forms of creative writing, discovering their unique voice.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Program Feature 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">Program Details</h3>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 transition-colors duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Online Group Classes (Grades 4–7 only)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Two classes per week, 60 minutes each</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Small batch size for personal attention</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Led by experienced English teacher</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:order-1 relative">
                <div className="bg-gradient-to-br from-yellow-200 to-orange-200 dark:from-yellow-800/50 dark:to-orange-800/50 rounded-3xl p-8 transform -rotate-2 transition-colors duration-300">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
                    <Users className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mb-4 transition-colors duration-300" />
                    <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Small Groups</h4>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Intimate class sizes ensure every student gets the attention they deserve.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form - Floating Cards */}
      <section id="apply" className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-800 dark:via-purple-900/10 dark:to-gray-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-200 dark:bg-purple-800/50 rounded-full px-6 py-3 mb-6 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-purple-700 dark:text-purple-300 transition-colors duration-300" />
              <span className="text-purple-800 dark:text-purple-200 font-semibold transition-colors duration-300">Join Us</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">Apply for Classes</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 transition-colors duration-300">Ready to unlock your child&apos;s creative potential? Apply now!</p>
          </div>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl transition-colors duration-300">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800 dark:text-gray-100 transition-colors duration-300">Student Application Form</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 transition-colors duration-300">Fill out the form below and The teacher will contact you soon</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Name of the Student *</Label>
                    <Input
                      id="name"
                      placeholder="Your answer"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                      required
                      className="border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700 dark:text-gray-100 transition-colors duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Grade *</Label>
                    <Input
                      id="grade"
                      placeholder="Your answer"
                      value={formData.grade}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, grade: e.target.value})}
                      required
                      className="border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700 dark:text-gray-100 transition-colors duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Phone number *</Label>
                  <Input
                    id="phone"
                    placeholder="Your answer"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})}
                    required
                    className="border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700 dark:text-gray-100 transition-colors duration-300"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Which program do you want to enroll in? *</Label>
                  <RadioGroup
                    value={formData.program}
                    onValueChange={(value) => setFormData({...formData, program: value})}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      <RadioGroupItem value="creative-writing" id="creative-writing" className="border-purple-300 dark:border-purple-600" />
                      <Label htmlFor="creative-writing" className="text-gray-700 dark:text-gray-300 cursor-pointer transition-colors duration-300">Creative Writing</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      <RadioGroupItem value="spoken-english" id="spoken-english" className="border-purple-300 dark:border-purple-600" />
                      <Label htmlFor="spoken-english" className="text-gray-700 dark:text-gray-300 cursor-pointer transition-colors duration-300">Spoken English</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                      <RadioGroupItem value="japanese" id="japanese" className="border-purple-300 dark:border-purple-600" />
                      <Label htmlFor="japanese" className="text-gray-700 dark:text-gray-300 cursor-pointer transition-colors duration-300">Japanese</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-gray-700 dark:text-gray-300 font-medium transition-colors duration-300">Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Your answer"
                    value={formData.comments}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, comments: e.target.value})}
                    className="border-purple-200 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700 dark:text-gray-100 min-h-[100px] transition-colors duration-300"
                  />
                </div>

                <div className="flex justify-center pt-6">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
                
                {submitMessage && (
                  <div className={`mt-4 p-4 rounded-lg text-center ${
                    submitMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                  } transition-colors duration-300`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Student Showcase - PDF Gallery */}
      <section id="showcase" className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-yellow-200 dark:bg-yellow-800/50 rounded-full px-6 py-3 mb-6 transition-colors duration-300">
              <Star className="w-5 h-5 text-yellow-700 dark:text-yellow-300 transition-colors duration-300" />
              <span className="text-yellow-800 dark:text-yellow-200 font-semibold transition-colors duration-300">Student Showcase</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300">Celebrating Young Voices</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
              This gallery showcases the incredible creativity of our students. Each piece represents authentic voices of children, 
              celebrating their unique perspectives and growing confidence in creative expression.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studentWorks.map((work, index) => (
              <Dialog key={work.id}>
                <DialogTrigger asChild>
                  <Card className={`cursor-pointer bg-gradient-to-br ${
                    index % 3 === 0 ? 'from-purple-100 to-pink-100 dark:from-purple-800/50 dark:to-pink-800/50' :
                    index % 3 === 1 ? 'from-blue-100 to-indigo-100 dark:from-blue-800/50 dark:to-indigo-800/50' :
                    'from-yellow-100 to-orange-100 dark:from-yellow-800/50 dark:to-orange-800/50'
                  } border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          index % 3 === 0 ? 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200' :
                          index % 3 === 1 ? 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200' :
                          'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-200'
                        } transition-colors duration-300`}>
                          {work.type}
                        </span>
                        <div className="flex items-center space-x-1">
                          <FileText className={`w-4 h-4 ${
                            index % 3 === 0 ? 'text-purple-600 dark:text-purple-400' :
                            index % 3 === 1 ? 'text-blue-600 dark:text-blue-400' :
                            'text-orange-600 dark:text-orange-400'
                          } transition-colors duration-300`} />
                          <Eye className={`w-4 h-4 ${
                            index % 3 === 0 ? 'text-purple-600 dark:text-purple-400' :
                            index % 3 === 1 ? 'text-blue-600 dark:text-blue-400' :
                            'text-orange-600 dark:text-orange-400'
                          } opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                        </div>
                      </div>
                      
      {/* PDF Thumbnail */}
                      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-white dark:bg-gray-700 shadow-md transition-colors duration-300">
                        <Image
                            src={`${work.thumbnailUrl}?t=${Date.now()}`}
                            alt={`${work.title} thumbnail`}
                            width={400}
                            height={192}
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={() => console.log(`✅ Successfully loaded: ${work.thumbnailUrl}`)}
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              console.error(`❌ Failed to load: ${work.thumbnailUrl}`, e);
                              e.currentTarget.src = "/logo.png"; // Fallback to a default image
                            }}
                          />
                        <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center pointer-events-none">
                          <div className="bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Eye className="w-6 h-6 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                          </div>
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl text-gray-800 dark:text-gray-100 line-clamp-2 transition-colors duration-300">{work.title}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 font-medium flex items-center justify-between transition-colors duration-300">
                        <span>by {work.author}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{work.publishedDate}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm line-clamp-3 transition-colors duration-300">
                        {work.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium transition-colors duration-300">Click to view PDF</span>
                        <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">PDF</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                
                <DialogContent className={`${isMobile ? 'max-w-[95vw] w-[95vw] h-[90vh]' : 'max-w-[98vw] w-[98vw] h-[98vh]'} p-4 dark:bg-gray-800 transition-colors duration-300`}>
                  {isMobile ? (
                    <>
                      <VisuallyHidden>
                        <DialogTitle>{work.title} - by {work.author}</DialogTitle>
                      </VisuallyHidden>
                      <MobilePDFViewer work={work} index={index} />
                    </>
                  ) : (
                    <>
                      <DialogHeader className="pb-3">
                        <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                          {work.title} - by {work.author}
                        </DialogTitle>
                      </DialogHeader>
                      
                      {/* Desktop PDF Viewer */}
                      <div className="flex-1 h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <iframe
                          src={`${work.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          className="w-full h-full"
                          title={`${work.title} by ${work.author}`}
                          style={{ minHeight: '85vh' }}
                        >
                          <p className="p-4 text-center text-gray-600 dark:text-gray-300">
                            Your browser doesn&apos;t support PDF viewing.
                            Please try refreshing the page or using a different browser.
                          </p>
                        </iframe>
                      </div>
                      
                      {/* Desktop Footer with description only */}
                      <div className="mt-2 p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-1">
                            {work.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                            Published: {work.publishedDate} • {work.type}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300">Want to see your child&apos;s work featured here?</p>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300">
              <a href="#apply">Join Our Program</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Wave Design */}
      <footer className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 text-white relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-16 bg-white dark:bg-gray-900 rounded-b-[100px] transition-colors duration-300"></div>
        <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4 text-white">Ready to Begin Your Writing Journey?</h3>
            <p className="text-xl text-purple-100 dark:text-purple-200 mb-8 transition-colors duration-300">
              Contact The Teacher today and help your child discover the joy of creative writing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-300 dark:text-pink-200 transition-colors duration-300" />
                <span className="text-purple-100 dark:text-purple-200 transition-colors duration-300">Nurturing Young Writers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-pink-300 dark:text-pink-200 transition-colors duration-300" />
                <span className="text-purple-100 dark:text-purple-200 transition-colors duration-300">Small Batch Classes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-pink-300 dark:text-pink-200 transition-colors duration-300" />
                <span className="text-purple-100 dark:text-purple-200 transition-colors duration-300">Creative Expression</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}