import React, { useEffect } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Activity, Shield, Users, Brain, ChevronRight, CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Scroll Animation Hooks for 3D Background
  const { scrollYProgress } = useScroll();
  
  // Parallax and 3D rotation transforms based on scroll
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.2, 0.8]);

  // Section Animation controls
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  // Framer motion variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-cyan-500/20 relative">
      
      {/* 3D Animated Parallax Background Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" style={{ perspective: '1000px' }}>
        {/* Subtle Perspective Grid */}
        <motion.div 
          style={{ rotateX: 60, translateY: y2, scale: 2 }}
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgzOHYzOEgxem0xIDM2aDM2VjJIMnoiIGZpbGw9IiNmMWY1ZjkiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-60 origin-top [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)]" 
        />
        
        {/* Floating 3D Orbs */}
        <motion.div 
          style={{ y: y1, rotateX: rotate1, rotateY: rotate2, scale: scale1 }}
          className="absolute -top-[10%] -left-[10%] w-[40rem] h-[40rem] bg-cyan-200/40 rounded-full blur-[100px] mix-blend-multiply will-change-transform"
        />
        <motion.div 
          style={{ y: y2, rotateZ: rotate1, rotateX: rotate2 }}
          className="absolute top-[30%] -right-[15%] w-[45rem] h-[45rem] bg-blue-200/30 rounded-[40%_60%_70%_30%] blur-[120px] mix-blend-multiply will-change-transform"
        />
        <motion.div 
          style={{ y: y3, x: y2, rotateZ: rotate2, scale: scale1 }}
          className="absolute bottom-[-20%] left-[20%] w-[35rem] h-[35rem] bg-purple-200/40 rounded-[60%_40%_30%_70%] blur-[100px] mix-blend-multiply will-change-transform"
        />
      </div>

      {/* Content wrapper with z-10 to stay above background */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="fixed w-full z-50 top-0 border-b border-slate-200/50 bg-white/60 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                CareVision
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/register')}
                className="text-sm font-medium px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all hover:shadow-md"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="text-left"
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 text-cyan-600 text-sm font-medium mb-6 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  CareVision v2.0 Live
                </motion.div>
                
                <motion.h1 
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { 
                      opacity: 1,
                      transition: { staggerChildren: 0.15, delayChildren: 0.2 } 
                    }
                  }}
                  className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900 drop-shadow-sm flex flex-col items-start"
                >
                  <div className="flex flex-wrap gap-[0.3em]">
                    <motion.span variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }} className="inline-block">
                      <motion.span animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>Healthcare</motion.span>
                    </motion.span>
                    <motion.span variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }} className="inline-block">
                      <motion.span animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}>Intelligence,</motion.span>
                    </motion.span>
                  </div>
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                      visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" } }
                    }}
                    className="mt-1"
                  >
                    <motion.span
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        filter: ["drop-shadow(0px 0px 0px rgba(6,182,212,0))", "drop-shadow(0px 0px 15px rgba(6,182,212,0.3))", "drop-shadow(0px 0px 0px rgba(6,182,212,0))"]
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-block bg-clip-text text-transparent bg-[linear-gradient(to_right,#06b6d4,#2563eb,#9333ea,#06b6d4)] bg-[length:200%_auto] pb-2"
                    >
                      Elevated.
                    </motion.span>
                  </motion.div>
                </motion.h1>
                
                <motion.p variants={fadeIn} className="text-lg lg:text-xl text-slate-600 mb-8 max-w-xl">
                  Empowering Community Health Workers with AI-driven diagnostics, real-time monitoring, and seamless clinical workflows.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4">
                  <button 
                    onClick={() => navigate('/register')}
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
                  >
                    Start Free Trial
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-8 py-4 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 transition-all">
                    View Demo
                  </button>
                </motion.div>
                
                <motion.div variants={fadeIn} className="mt-12 flex items-center gap-6 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500" /> HIPAA Compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500" /> End-to-end Encryption
                  </div>
                </motion.div>
              </motion.div>
              
              {/* 3D Hero Image Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
                className="relative lg:h-[600px] w-full flex items-center justify-center perspective-1000"
              >
                 <div className="relative w-full aspect-square md:aspect-video lg:aspect-square rounded-2xl overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-300/50 group bg-white/50 backdrop-blur-sm transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-12 transform-style-3d">
                     <img 
                        src="/landing/hero_3d.png" 
                        alt="CareVision AI Dashboard" 
                        className="object-cover w-full h-full transform group-hover:scale-110 group-hover:translate-z-10 transition-all duration-700 mix-blend-multiply"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-50');
                          if (target.parentElement) {
                             target.parentElement.innerHTML = '<div class="text-slate-500 flex flex-col items-center"><svg class="w-16 h-16 mb-4 text-cyan-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span class="font-medium text-slate-600">Dashboard Visualization</span></div>';
                          }
                        }}
                      />
                 </div>
                 
                 {/* Floating Data Cards (Parallax effect simulation) */}
                 <motion.div 
                    animate={{ y: [0, -15, 0], rotateX: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute -right-8 top-1/4 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl hidden md:block"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                       <Activity className="w-5 h-5 text-emerald-600" />
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 font-medium">Vitals Status</p>
                       <p className="text-sm font-bold text-emerald-600">Stabilized</p>
                     </div>
                   </div>
                 </motion.div>
                 
                 <motion.div 
                    animate={{ y: [0, 15, 0], rotateY: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute -left-8 bottom-1/4 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl hidden md:block"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                       <Brain className="w-5 h-5 text-cyan-600" />
                     </div>
                     <div>
                       <p className="text-xs text-slate-500 font-medium">AI Analysis</p>
                       <p className="text-sm font-bold text-cyan-600">Completed (99.8%)</p>
                     </div>
                   </div>
                 </motion.div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative border-y border-slate-200/50 bg-white/50 backdrop-blur-sm" ref={ref}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">A Comprehensive Ecosystem</h2>
              <p className="text-slate-600 text-lg">
                Everything you need to manage patient care, analyze diagnostics, and coordinate with clinical teams in one unified platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                variants={fadeIn}
                initial="hidden"
                animate={controls}
                className="p-8 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:rotate-6 transition-all duration-300">
                  <Brain className="w-6 h-6 text-cyan-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">AI Diagnostics</h3>
                <p className="text-slate-600 leading-relaxed">
                  Leverage advanced computer vision for instant analysis of test strips, medical scans, and wound assessments.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                variants={fadeIn}
                initial="hidden"
                animate={controls}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-[0.02] mix-blend-multiply group-hover:opacity-[0.05] group-hover:scale-110 transition-all duration-700">
                  <img src="/landing/features_3d.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500 group-hover:-rotate-6 transition-all duration-300">
                    <Activity className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">Real-time Monitoring</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Track patient vitals and treatment adherence with continuous data synchronization across devices.
                  </p>
                </div>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                variants={fadeIn}
                initial="hidden"
                animate={controls}
                transition={{ delay: 0.4 }}
                className="p-8 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:rotate-12 transition-all duration-300">
                  <Users className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">Team Collaboration</h3>
                <p className="text-slate-600 leading-relaxed">
                  Securely share patient records and diagnostic results between field workers and supervising physicians.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonial / Story Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              <motion.div 
                initial={{ opacity: 0, x: -50, rotateY: 20 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, type: "spring" }}
                className="order-2 lg:order-1 relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] shadow-2xl bg-white group perspective-1000"
              >
                <img 
                  src="/landing/chw_photo.png" 
                  alt="Community Health Worker using CareVision" 
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex items-end p-8 transform-gpu">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-white font-medium text-lg leading-snug drop-shadow-md">"CareVision transformed how we deliver care in remote areas. The AI assistance gives us clinical confidence in the field."</p>
                    <p className="text-slate-300 text-sm mt-3 font-medium">— Sarah N., Community Health Worker</p>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="order-1 lg:order-2"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">Designed for Impact</h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  CareVision bridges the gap between technology and human-centric care. Our platform is built from the ground up to operate reliably in low-resource settings while delivering enterprise-grade clinical insights.
                </p>
                
                <ul className="space-y-5">
                  {[
                    'Offline-first architecture for unreliable networks',
                    'Multi-language support for diverse communities',
                    'Automated clinical protocols and guided assessments'
                  ].map((item, i) => (
                    <motion.li 
                      key={i}
                      whileHover={{ x: 10 }}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/60 hover:backdrop-blur hover:shadow-sm transition-all border border-transparent hover:border-slate-200/50"
                    >
                      <div className="mt-0.5 w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
              
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative bg-white/40 backdrop-blur-md border-t border-slate-200/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-50/90 to-blue-50/90 border border-cyan-100 p-12 text-center shadow-2xl shadow-cyan-900/5"
            >
              {/* Ambient background glow inside card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-white/40 blur-[80px] pointer-events-none transform rotate-12" />
              
              <div className="relative z-10">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-16 h-16 mx-auto bg-white rounded-2xl shadow-md shadow-cyan-900/5 border border-cyan-100 flex items-center justify-center mb-6"
                >
                  <Shield className="w-8 h-8 text-cyan-600" />
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">Ready to transform your workflow?</h2>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                  Join thousands of healthcare professionals using CareVision to deliver better patient outcomes.
                </p>
                <button 
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all text-lg flex items-center gap-2 mx-auto group"
                >
                  Create Free Account
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-900">CareVision</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              © {new Date().getFullYear()} CareVision Healthcare Systems. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-cyan-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-cyan-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-cyan-600 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
        
      </div>
    </div>
  );
};

export default LandingPage;
