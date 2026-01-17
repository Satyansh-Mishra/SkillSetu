"use client";

import { useState } from "react";
import Image from "next/image";
import favicon from "@/app/favicon.ico";

interface Product {
  id: number;
  icon: string;
  title: string;
  price: string;
  priceSubtext: string;
  description: string;
}

interface Feature {
  id: number;
  title: string;
  subtitle: string;
  image?: string;
  video?: string;
  colSpan: string;
  theme: 'dark' | 'light';
}

export default function SquareLanding() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);

  const products: Product[] = [
    {
      id: 1,
      icon: "",
      title: "Live 1-on-1 Skill Sessions",
      price: "From $10/hr",
      priceSubtext: "Pay only for the lessons you take",
      description:
        "Learn any skill through real-time video calls with expert teachers — screen sharing, whiteboard, recordings and AI notes included.",
    },
    {
      id: 2,
      icon: "",
      title: "AI-Powered Teacher Matching",
      price: "Free",
      priceSubtext: "Included with every signup",
      description:
        "Our AI finds the perfect teacher for you based on skill level, availability, learning style, price and reviews — no more endless searching.",
    },
    {
      id: 3,
      icon: "",
      title: "Certificates & Skill Badges",
      price: "Included",
      priceSubtext: "Earn as you learn",
      description:
        "Complete learning paths, earn verifiable certificates and digital badges you can share on LinkedIn and your resume.",
    },
    {
      id: 4,
      icon: "",
      title: "Teaching & Earning Money",
      price: "Up to $50/hr",
      priceSubtext: "Set your own rates",
      description:
        "Turn your skills into income by teaching students around the world — get paid securely after every lesson.",
    },
  ];

  const features: Feature[] = [
    {
      id: 1,
      title: "Live 1-on-1 Skill Sessions",
      description:
        "Learn directly from real people through high-quality video calls with screen sharing, collaborative whiteboard, session recordings, and AI-generated notes.",
    },
    {
      id: 2,
      title: "AI-Powered Teacher Matching",
      description:
        "Our recommendation engine finds the best teacher for you based on skill level, learning goals, budget, availability, and past learner success.",
    },
    {
      id: 3,
      title: "Verified Certificates and Skill Proof",
      description:
        "Complete structured learning paths and earn verifiable certificates and digital credentials that can be shared on LinkedIn and with employers.",
    },
    {
      id: 4,
      title: "Teach and Earn Globally",
      description:
        "Monetize your expertise by teaching students around the world. Set your own rates, manage availability, and receive secure payouts after every lesson.",
    },
    {
      id: 5,
      title: "Community, Groups, and Mentorship",
      description:
        "Learn faster through discussion forums, skill-based communities, and one-to-one mentorship programs guided by AI matching.",
    },
    {
      id: 6,
      title: "Personal Learning and Earnings Dashboard",
      description:
        "Track your learning progress, upcoming sessions, earned certificates, student reviews, and income — all from one powerful dashboard.",
    },
  ];
  const stats: Stat[] = [
    {
      id: 1,
      number: "10,000+",
      description: "students learning on the platform",
    },
    {
      id: 2,
      number: "1,200+",
      description: "verified teachers available",
    },
    {
      id: 3,
      number: "25,000+",
      description: "live lessons completed",
    },
    {
      id: 4,
      number: "$500K+",
      description: "earned by teachers so far",
    },
  ];

  const footerSections: FooterSection[] = [
    {
      title: "Platform",
      links: [
        "Find a Teacher",
        "Become a Teacher",
        "Live Classes",
        "Learning Paths",
      ],
    },
    {
      title: "Community",
      links: [
        "Skill Groups",
        "Discussion Forum",
        "Mentorship",
        "Success Stories",
      ],
    },
    {
      title: "Company",
      links: ["About Us", "Careers", "Blog", "Press"],
    },
    {
      title: "Support",
      links: [
        "Help Center",
        "Safety & Trust",
        "Contact Support",
        "System Status",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a
            href="#"
            className="flex items-center gap-1 text-2xl font-bold text-gray-900 tracking-tight"
          >
            <Image
              src={favicon}
              alt="SkillSetu logo"
              className="w-12 h-12"
            ></Image>
            <span>SkillSetu</span>
          </a>

          <nav className="hidden md:flex gap-12 items-center">
            <a
              href="#products"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition"
            >
              Learn
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition"
            >
              Teach
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition"
            >
              How it works?
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition"
            >
              Community
            </a>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition transform hover:-translate-y-0.5 shadow-lg hover:shadow-lg">
              Start Learning
            </button>
          </nav>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden mt-16">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-10"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://pw-assets-production-c.squarecdn.com/video/5mObdhW0r5D0lyp3iVJFA6/b4d81931-7cfa-4402-bb41-efc4126e3f95-en-ee526a6b-3ca3-4ae5-9bc2-be60cb21229f-en-Homepage_Edit-updated.webm"
            type="video/webm"
          />
          Your browser does not support the video tag.
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-gray-900/40 to-gray-900/20 z-20"></div>
        <div className="relative z-30 text-center text-white max-w-2xl px-6">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            Learn any skill from real people.
          </h1>
          <p className="text-xl md:text-2xl mb-12 font-light opacity-95">
            Book 1-on-1 video lessons with expert teachers, earn
            certificates,and even make money by teaching what you know.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:-translate-y-0.5 shadow-xl hover:shadow-2xl">
              Start Learning
            </button>
            <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Become a Teacher
            </button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 px-6 bg-gray-50" id="products">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              One platform to learn, teach, and grow
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you want to master a new skill or earn by teaching,
              SkillSetu gives you everything you need in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white p-8 rounded-2xl border border-gray-200 transition transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
              >
                <div className="text-4xl mb-4">{product.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {product.title}
                </h3>
                <div className="text-3xl font-bold text-indigo-600 mb-2">
                  {product.price}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {product.priceSubtext}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>
                <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                  Explore
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Everything you need to learn and teach online
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From live classes and AI matching to certificates and payments,
              SkillSetu brings the entire learning experience into one platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="p-8 rounded-2xl bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 border border-gray-200"
              >
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-linear-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat) => (
              <div key={stat.id}>
                <h4 className="text-5xl font-bold mb-2">{stat.number}</h4>
                <p className="text-lg opacity-95 font-light">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-linear-to-r from-indigo-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to learn or start Learning?
          </h2>
          <p className="text-xl mb-10 opacity-95">
            Join thousands of learners and teachers building skills, careers,
            and income on SkillSetu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:-translate-y-0.5 text-lg shadow-xl">
              Start Learning
            </button>
            <button className="px-10 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition text-lg">
              Become a Teacher
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4 text-white">
                  {section.title}
                </h4>
                {section.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href="#"
                    className="text-gray-400 text-sm hover:text-white transition block mb-3"
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; 2026 SkillSetu, Inc. All rights reserved. | Privacy | Terms
              | Accessibility
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
