'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DogAssessmentBot from '@/components/DogAssessmentBot';

export default function Home() {
  const [showAssessmentBot, setShowAssessmentBot] = useState(false);

  const handleAssessmentComplete = (result: { code?: string; dogProfile?: { name: string; age: string; breed: string; size: string; energyLevel: string; behaviorIssues: string[]; healthIssues: string[]; environment: string; experience: string }; recommendations?: { primaryProgram: string; secondaryPrograms: string[]; reasoning: string; urgency: 'low' | 'medium' | 'high' } }) => {
    setShowAssessmentBot(false);
    
    // Show success message with code
    if (result.code) {
      alert(`Assessment completed! Your code is: ${result.code}\n\nPlease log in and enter this code in the Dogs section to create your dog profile.`);
    } else {
      alert('Assessment completed! Please log in to create your dog profile and view recommendations.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(0_32_96)] from-opacity-5 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                          <h1 className="text-2xl font-bold text-[rgb(0_32_96)] flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img 
                src="/images/icons/logo.png" 
                alt="Just Dogs Logo" 
                className="w-6 h-6 object-contain"
              />
            </div>
            <span>Just Dogs</span>
          </h1>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#team" className="text-gray-600 hover:text-[rgb(0_32_96)] font-medium transition-colors">
                Our Team
              </Link>
              <Link href="#gallery" className="text-gray-600 hover:text-[rgb(0_32_96)] font-medium transition-colors">
                Our Dogs
              </Link>
              <Link href="#services" className="text-gray-600 hover:text-[rgb(0_32_96)] font-medium transition-colors">
                Services
              </Link>
            </nav>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="outline" className="border-[rgb(0_32_96)] text-[rgb(0_32_96)] hover:bg-[rgb(0_32_96)] hover:text-white transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[rgb(0_32_96)] hover:bg-[rgb(0_24_72)] transition-colors">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background dog images */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full overflow-hidden animate-bounce" style={{animationDuration: '3s'}}>
            <img src="/1000524395.jpg" alt="Happy dog" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-20 right-20 w-24 h-24 rounded-full overflow-hidden animate-pulse" style={{animationDuration: '2s'}}>
            <img src="/1000524743.jpg" alt="Playful dog" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-20 left-20 w-28 h-28 rounded-full overflow-hidden animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
            <img src="/1000525223.jpg" alt="Training dog" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-10 right-10 w-20 h-20 rounded-full overflow-hidden animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>
            <img src="/1000531276.jpg" alt="Cute dog" className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-[rgb(0_32_96)] bg-opacity-20 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-[rgb(0_32_96)] bg-opacity-30 rounded-full animate-ping" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[rgb(0_32_96)] bg-opacity-25 rounded-full animate-ping" style={{animationDuration: '4s', animationDelay: '2s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight text-center animate-pulse" style={{animationDuration: '3s'}}>
            Professional Dog Services for{' '}
            <span className="text-[rgb(0_32_96)] bg-gradient-to-r from-[rgb(0_32_96)] to-[rgb(0_24_96)] bg-clip-text text-transparent animate-bounce" style={{animationDuration: '2s'}}>
              Every Need
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            From pet care to specialized training, we provide comprehensive dog services 
            with professional management. Track progress, manage bookings, and ensure 
            the best care for every dog in your care.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              onClick={() => setShowAssessmentBot(true)}
              size="lg" 
              className="text-lg px-8 py-4 bg-[rgb(0_32_96)] hover:bg-[rgb(0_24_72)] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 animate-pulse"
              style={{animationDuration: '2s'}}
            >
              🐕 Get Personalized Recommendations
            </Button>
            <Link href="/register">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 border-2 border-[rgb(0_32_96)] text-[rgb(0_32_96)] hover:bg-[rgb(0_32_96)] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Sign Up
              </Button>
            </Link>
          </div>

          
          {/* Animated Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center group">
              <div className="text-2xl font-bold text-[rgb(0_32_96)] mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
              <div className="text-sm text-gray-600 group-hover:text-[rgb(0_32_96)] transition-colors">Happy Dogs</div>
              <div className="w-8 h-1 bg-[rgb(0_32_96)] mx-auto mt-2 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center group">
              <div className="text-2xl font-bold text-[rgb(0_32_96)] mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-sm text-gray-600 group-hover:text-[rgb(0_32_96)] transition-colors">Professional Trainers</div>
              <div className="w-8 h-1 bg-[rgb(0_32_96)] mx-auto mt-2 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="text-center group">
              <div className="text-2xl font-bold text-[rgb(0_32_96)] mb-2 group-hover:scale-110 transition-transform duration-300">98%</div>
              <div className="text-sm text-gray-600 group-hover:text-[rgb(0_32_96)] transition-colors">Satisfaction Rate</div>
              <div className="w-8 h-1 bg-[rgb(0_32_96)] mx-auto mt-2 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Trainers */}
      <section id="team" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Expert Team
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Qualified professionals dedicated to providing the best care for your dogs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Lucy - Founder */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">L</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Lucy</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Founder & Lead Behaviourist</p>
                <p className="text-gray-600 text-sm">
                  BSC(Hons) Animal Science, Behaviour and Welfare. Training dogs since 2005, 
                  founded Just Dogs in 2014. Oversees all operations and ensures every dog receives expert care.
                </p>
              </CardContent>
            </Card>

            {/* Andy */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">A</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Andy</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Qualified Dog Behaviourist</p>
                <p className="text-gray-600 text-sm">
                  Registered Dog Behaviourist specializing in behaviour modification, training, 
                  and puppy school. Passionate about helping dogs and owners thrive together.
                </p>
              </CardContent>
            </Card>

            {/* Robyn */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">R</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Robyn</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Animal Behaviourist</p>
                <p className="text-gray-600 text-sm">
                  COAPE International qualified behaviourist with a science-based, force-free approach. 
                  Committed to strengthening the human-canine bond through understanding and support.
                </p>
              </CardContent>
            </Card>

            {/* Nicole */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">N</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nicole</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Canine Behaviourist & Trainer</p>
                <p className="text-gray-600 text-sm">
                  Qualified Canine Behaviourist with Veterinary Physiotherapy background. 
                  Specializes in individual training, group classes, and Medical Alert Dogs.
                </p>
              </CardContent>
            </Card>

            {/* Chelsey */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">C</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Chelsey</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Senior Handler</p>
                <p className="text-gray-600 text-sm">
                  Experienced handler working with 38+ dogs weekly since 2017. 
                  Passionate about providing exceptional care and building strong relationships with every dog.
                </p>
              </CardContent>
            </Card>

            {/* Olivia */}
            <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-[rgb(0_32_96)] rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <span className="text-white text-2xl font-bold">O</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Olivia</h3>
                <p className="text-[rgb(0_32_96)] font-medium mb-3">Dog Trainer & Behaviourist</p>
                <p className="text-gray-600 text-sm">
                  Specialized in Medical Alert Dogs training and behaviour modification. 
                  Former film industry professional who found her calling in canine care.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Our team is COAPE/EthologyAc qualified and SABCAP registered
            </p>
            <p className="text-sm text-gray-500">
              Medipet recognizes Just Dogs as a registered behaviour training company
            </p>
          </div>
        </div>
      </section>

      {/* Our Happy Dogs Gallery */}
      <section id="gallery" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Our Happy Dogs
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Meet some of the amazing dogs we&apos;ve had the pleasure of working with
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000524395.jpg" alt="Happy dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000524743.jpg" alt="Playful dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000525223.jpg" alt="Training dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000531276.jpg" alt="Cute dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000531400.jpg" alt="Adorable dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000532605.jpg" alt="Friendly dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000532661.jpg" alt="Loving dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000538234.jpg" alt="Beautiful dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000539282.jpg" alt="Sweet dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <img src="/1000543258.jpg" alt="Amazing dog" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-lg">
              Every dog has a unique personality and story. We&apos;re proud to be part of their journey.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Our Professional Services
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive dog care and training services tailored to meet every need, 
              from basic pet care to specialized behavioral training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <img src="/1000525223.jpg" alt="Training dog" className="w-full h-full object-cover" />
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Private Training</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  With one of our Registered Qualified Trainers AFTER a consultation or social assessment. Recommended after a complex or mini consultation, or a social assessment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R250 per 1 hr session</p>
                  <p className="text-sm text-gray-600">+ R150 per additional dog in the same session</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Held at varying locations or at home</li>
                    <li>• Focuses on empowering you to help your dog thrive</li>
                    <li>• Covers manners, basic training, social and life skills</li>
                    <li>• Any reactivity requires Complex Consultation first</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-[rgb(0_32_96)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <span className="text-2xl text-white">📚</span>
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Tutoring (Private training add on)</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  With one of our passionate qualified trainers. For socialisation practice, manners, basic training, walking and life skills for any aged dog.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R200 per session</p>
                  <p className="text-sm text-gray-600">R150 per additional dog within same time frame</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Your dog is worked with at your home, or collected</li>
                    <li>• Sessions are 40 minutes long (not including travel time)</li>
                    <li>• Feedback given after each session via WhatsApp group</li>
                    <li>• You will still be required to join some sessions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <img src="/1000531400.jpg" alt="Playful dog" className="w-full h-full object-cover" />
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Private Activity & Enrichment Service</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  With a passionate, pet first aid trained handler or trainer. For additional exercise, stimulation and fun! Great for focus and confidence building.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R200 for a full 1.5 hour session</p>
                  <p className="text-sm text-gray-600">Handler brings their own equipment, treats and toys</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• A handler comes to your home and works in your yard</li>
                    <li>• Physical activities, mental stimulation activities included</li>
                    <li>• Educare brain training for self-control and lifestyle skills</li>
                    <li>• Tailored to your dog&apos;s needs and preferences</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <img src="/1000532605.jpg" alt="Walking dog" className="w-full h-full object-cover" />
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">The Dog Jog Walking and Socialisation Service</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  With a passionate, pet first aid trained handler or trainer. For exercise, outdoor stimulation and fun, social playdates with compatible friends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R100 per walk for one dog</p>
                  <p className="text-sm text-gray-600">+ R45 per additional dog</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Your dog/s are collected from your house</li>
                    <li>• Varying locations (beach, vlei, parks, residential)</li>
                    <li>• Walks are 40 minutes long (not including travel time)</li>
                    <li>• Social walks are popular, but private walks available</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-[rgb(0_32_96)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">🏠</span>
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Pet Care & Sitting</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  Professional pet care services including feeding, walking, and overnight care for your beloved pets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">Starting from R150/day</p>
                  <p className="text-sm text-gray-600">Flexible scheduling and personalized care</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Daily feeding and medication</li>
                    <li>• Regular exercise and playtime</li>
                    <li>• Overnight care available</li>
                    <li>• Photo updates included</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-[rgb(0_32_96)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">🎓</span>
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Group Training Classes</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  Structured group training sessions for socialization and basic obedience training in a controlled environment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R300 per 6-week course</p>
                  <p className="text-sm text-gray-600">Small group sizes for personalized attention</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Basic obedience commands</li>
                    <li>• Socialization with other dogs</li>
                    <li>• Professional trainer guidance</li>
                    <li>• Take-home training materials</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-[rgb(0_32_96)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">🏥</span>
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Health & Wellness</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  Comprehensive health monitoring and wellness programs to keep your dog in optimal condition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R200 per wellness check</p>
                  <p className="text-sm text-gray-600">Regular health assessments and care plans</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Weight and nutrition monitoring</li>
                    <li>• Exercise and activity tracking</li>
                    <li>• Health record maintenance</li>
                    <li>• Vet coordination services</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-[rgb(0_32_96)] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl text-white">🎯</span>
                </div>
                <CardTitle className="text-xl text-[rgb(0_32_96)]">Specialized Training</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  Advanced training programs for specific needs including therapy dog preparation and specialized behavioral modification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[rgb(0_32_96)]">R500 per specialized program</p>
                  <p className="text-sm text-gray-600">Customized training for specific requirements</p>
                  <ul className="text-sm text-gray-600 space-y-1 mt-3">
                    <li>• Therapy dog certification prep</li>
                    <li>• Service dog training basics</li>
                    <li>• Advanced behavioral modification</li>
                    <li>• Specialized skill development</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>




      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">🐕</span>
                <span>Just Dogs</span>
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
            <p>© 2024 Just Dogs. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Dog Assessment Bot */}
      <DogAssessmentBot
        isOpen={showAssessmentBot}
        onClose={() => setShowAssessmentBot(false)}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}
