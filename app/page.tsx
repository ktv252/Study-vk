"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Code2, 
  Rocket, 
  Users, 
  PlayCircle, 
  ArrowRight,
  Github,
  Trophy,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantumParticles } from "@/app/components/QuantumParticles";

const stats = [
  { label: "Active Students", value: "10K+", icon: Users },
  { label: "Courses Available", value: "100+", icon: BookOpen },
  { label: "Hours of Content", value: "5000+", icon: PlayCircle },
];

const features = [
  {
    title: "Expert Instruction",
    desc: "Learn from top educators with years of experience in their fields.",
    icon: Trophy,
    color: "text-yellow-400"
  },
  {
    title: "Interactive Coding",
    desc: "Built-in platforms to practice coding while you learn.",
    icon: Code2,
    color: "text-blue-400"
  },
  {
    title: "Track Progress",
    desc: "Detailed analytics to monitor your learning journey.",
    icon: Target,
    color: "text-green-400"
  }
];

export default function Home() {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServerInfo() {
      try {
        const res = await fetch("/api/auth/serverInfo");
        if (res.ok) {
          const data = await res.json();
          setServerInfo(data);
        }
      } catch (err) {
        console.error("Could not load server info");
      } finally {
        setLoading(false);
      }
    }
    fetchServerInfo();
  }, []);

  const appName = serverInfo?.webName || "PowerStudy VPS";

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-purple-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <QuantumParticles />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient">{appName}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Courses</a>
            <a href="#" className="hover:text-white transition-colors">Test Series</a>
            <a href="#" className="hover:text-white transition-colors">Free Content</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:flex text-gray-400 hover:text-white" asChild>
              <a href="/auth">Login</a>
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200" asChild>
              <a href="/study">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider text-purple-400 uppercase bg-purple-500/10 border border-purple-500/20 rounded-full">
              The Future of Learning is Here
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
              Master Your Future with <br />
              <span className="text-gradient-primary">Expert-Led Education</span>
            </h1>
            <p className="max-w-2xl mx-auto mb-12 text-lg md:text-xl text-gray-400 leading-relaxed font-light">
              Access world-class educational content, interactive coding environments, and 
              personalized learning paths. Start your journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 shadow-xl shadow-purple-500/20 group" asChild>
                <a href="/study">
                  Start Learning Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5" asChild>
                <a href="/auth">Student Login</a>
              </Button>
            </div>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-32">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-8 rounded-2xl group hover:scale-[1.02] transition-all"
              >
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="text-left mb-32">
            <div className="max-w-3xl mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose {appName}?</h2>
              <p className="text-gray-400 text-lg">
                We provide a comprehensive ecosystem designed for students who want to excel in their academic and professional careers.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="glass-card p-10 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <feature.icon className={`w-10 h-10 mb-6 ${feature.color}`} />
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed font-light">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 pt-20 pb-10 px-6 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Rocket className="w-6 h-6 text-purple-500" />
                <span className="text-xl font-bold tracking-tight">{appName}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 font-light">
                Empowering the next generation of builders and thinkers through quality education.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors font-light">Browse Courses</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Pricing Plans</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Student Dashboard</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors font-light">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">System Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors font-light">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors font-light">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
            <div className="flex gap-8">
              <span>Built with ❤️ for Students</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}