# CareVision - 3D Interactive Landing Page

A modern, high-performance landing page featuring immersive 3D visuals and scroll-based storytelling to showcase CareVision's innovative healthcare platform.

![CareVision Hero](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop)

## 🎯 Overview

CareVision is a next-generation healthcare management platform that revolutionizes patient care through AI-powered insights, real-time monitoring, and seamless provider collaboration. This landing page delivers an engaging visual experience that progressively reveals our platform's capabilities through scroll-triggered animations and 3D effects.

## ✨ Features

### Visual Experience
- **3D Parallax Scrolling** - Multi-layered depth effects that respond to scroll position
- **Scroll-Triggered Animations** - Elements fade, slide, and reveal as users explore
- **Dynamic 3D Objects** - Interactive Three.js elements including rotating medical icons and data visualizations
- **Smooth Transitions** - GSAP-powered animations for buttery-smooth motion
- **Typewriter Effects** - Progressive text reveals for key messaging
- **Particle Systems** - Ambient background animations that create depth
- **Metric Counters** - Animated statistics that count up on scroll reveal

### Content Sections
1. **Hero Section** - Immersive 3D introduction with floating medical elements
2. **Platform Overview** - Scroll-triggered feature cards with 3D hover effects
3. **Key Benefits** - Animated infographics showing impact metrics
4. **Technology Stack** - Interactive tech visualization with particle connections
5. **Customer Stories** - Carousel with parallax testimonial cards
6. **Pricing Tiers** - 3D pricing cards with smooth transitions
7. **Contact CTA** - Final conversion section with ambient animations

### Technical Highlights
- **Performance Optimized** - Lazy loading, code splitting, and optimized asset delivery
- **Fully Responsive** - Adaptive layouts for mobile (320px+), tablet, and desktop
- **Accessibility Compliant** - WCAG 2.1 AA standards with keyboard navigation
- **SEO Optimized** - Semantic HTML, meta tags, and structured data
- **Cross-Browser Compatible** - Tested on Chrome, Firefox, Safari, and Edge

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14** - React framework with App Router for optimal performance
- **React 18** - Latest stable release with concurrent features
- **TypeScript** - Type-safe development environment

### Animation & 3D
- **Three.js** - WebGL-based 3D graphics engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber
- **Framer Motion** - Production-ready motion library for React
- **GSAP** - Professional-grade animation platform
- **React Intersection Observer** - Scroll-triggered animation detection

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **CSS Modules** - Scoped styling for complex animations

### Media & Assets
- **Unsplash API** - High-quality placeholder imagery
- **React Icons** - Comprehensive icon library
- **next/image** - Optimized image loading with lazy loading

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks

## 📦 Installation

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm package manager
- Git for version control

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/carevision-landing.git
cd carevision-landing

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the landing page.

## 🏗️ Project Structure

```
carevision-landing/
├── public/
│   ├── models/          # 3D model files (.glb, .gltf)
│   ├── textures/        # Texture maps for 3D objects
│   └── images/          # Static image assets
├── src/
│   ├── app/
│   │   ├── layout.tsx   # Root layout with global styles
│   │   ├── page.tsx     # Main landing page
│   │   └── globals.css  # Global CSS and Tailwind imports
│   ├── components/
│   │   ├── sections/
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Benefits.tsx
│   │   │   ├── Technology.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── Pricing.tsx
│   │   │   └── Contact.tsx
│   │   ├── 3d/
│   │   │   ├── Scene3D.tsx          # Main Three.js scene
│   │   │   ├── MedicalIcon3D.tsx    # Animated medical icons
│   │   │   ├── DataVisualization.tsx # 3D data charts
│   │   │   └── ParticleSystem.tsx   # Background particles
│   │   ├── animations/
│   │   │   ├── ScrollReveal.tsx     # Scroll-triggered wrapper
│   │   │   ├── TypewriterText.tsx   # Text typing effect
│   │   │   ├── CounterAnimation.tsx # Number counting animation
│   │   │   └── ParallaxLayer.tsx    # Parallax scroll effect
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Container.tsx
│   ├── hooks/
│   │   ├── useScrollProgress.ts    # Track scroll position
│   │   ├── useParallax.ts          # Parallax calculations
│   │   └── useInView.ts            # Intersection observer
│   ├── lib/
│   │   ├── animations.ts           # GSAP animation presets
│   │   ├── three-utils.ts          # Three.js helpers
│   │   └── constants.ts            # Configuration constants
│   └── types/
│       └── index.ts                # TypeScript type definitions
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🎨 Animation Architecture

### Scroll-Triggered Animations

The landing page uses a multi-layered animation system:

```typescript
// Example: Scroll reveal component
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export const ScrollReveal = ({ children, variant = 'fadeIn' }) => {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const variants = {
    fadeIn: {
      hidden: { opacity: 0, y: 50 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    },
    slideLeft: {
      hidden: { opacity: 0, x: -100 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={variants[variant]}
    >
      {children}
    </motion.div>
  );
};
```

### 3D Scene Management

Three.js scenes are managed through react-three-fiber:

```typescript
// Example: 3D medical icon component
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export const MedicalIcon3D = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4F46E5" />
    </mesh>
  );
};
```

### Performance Optimization

- **Lazy Loading**: All 3D components are code-split and loaded on demand
- **Intersection Observer**: Animations only trigger when elements are visible
- **RequestAnimationFrame**: Smooth 60fps animations using browser's paint cycle
- **Debounced Scroll**: Scroll event handlers are throttled to prevent jank
- **Image Optimization**: Next.js Image component with blur placeholders

## 🎬 Animation Presets

### Available Variants

```typescript
// src/lib/animations.ts
export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: 'easeOut' } 
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { duration: 0.5, ease: 'backOut' } 
  }
};
```

## 📊 Content Structure

### Placeholder Data

All content uses realistic placeholder data representing CareVision's platform:

**Platform Statistics**:
- 50,000+ Healthcare Providers
- 2M+ Patients Served
- 99.9% Uptime SLA
- 40% Reduction in Administrative Time

**Key Features**:
1. AI-Powered Diagnostics
2. Real-Time Patient Monitoring
3. Secure Data Exchange
4. Predictive Analytics
5. Integrated Telehealth
6. Smart Scheduling

**Pricing Tiers**:
- Starter: $99/month (Up to 500 patients)
- Professional: $299/month (Up to 2,000 patients)
- Enterprise: Custom (Unlimited, white-label)

## 🎨 Customization Guide

### Updating Content

1. **Hero Section**: Edit `src/components/sections/Hero.tsx`
   ```typescript
   const heroData = {
     headline: "Your Custom Headline",
     subheadline: "Your custom description",
     ctaText: "Get Started"
   };
   ```

2. **Color Scheme**: Modify `tailwind.config.ts`
   ```typescript
   theme: {
     extend: {
       colors: {
         primary: '#4F46E5',    // Indigo
         secondary: '#06B6D4',  // Cyan
         accent: '#F59E0B'      // Amber
       }
     }
   }
   ```

3. **3D Assets**: Replace files in `public/models/` and update imports

### Adding New Sections

```typescript
// 1. Create component in src/components/sections/
// 2. Add to main page
import { NewSection } from '@/components/sections/NewSection';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <NewSection />  {/* Add here */}
      <Contact />
    </>
  );
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_api_key
NEXT_PUBLIC_SITE_URL=https://carevision.com
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Build for Production

```bash
npm run build
npm run start
```

### Static Export (Optional)

```bash
# Add to next.config.js
output: 'export'

# Build static files
npm run build
# Output in /out directory
```

## 🔧 Configuration

### Performance Optimization Settings

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### Animation Performance

```typescript
// Disable animations on low-end devices
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const animationConfig = {
  duration: prefersReducedMotion ? 0 : 0.6,
  ease: 'easeOut'
};
```

## 📱 Responsive Breakpoints

```css
/* Tailwind breakpoints used throughout */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## ♿ Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Reduced Motion**: Respects `prefers-reduced-motion` media query
- **Color Contrast**: WCAG AA compliant color ratios
- **Focus Indicators**: Visible focus states for all interactive elements

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build test
npm run build
```

## 📈 Performance Metrics

Target metrics (measured with Lighthouse):
- Performance: 95+
- Accessibility: 100
- Best Practices: 95+
- SEO: 100

## 🐛 Troubleshooting

### Common Issues

**3D scenes not rendering:**
- Ensure WebGL is enabled in browser
- Check browser console for Three.js errors
- Verify GPU acceleration is enabled

**Animations are janky:**
- Reduce particle count in `ParticleSystem.tsx`
- Disable 3D effects on mobile devices
- Check for unnecessary re-renders with React DevTools

**Images not loading:**
- Verify Unsplash API key in `.env.local`
- Check network tab for blocked requests
- Ensure domains are whitelisted in `next.config.js`

## 📚 Additional Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [GSAP Documentation](https://greensock.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Medical icons from [Heroicons](https://heroicons.com/)
- Images from [Unsplash](https://unsplash.com/)
- 3D models from [Sketchfab](https://sketchfab.com/) (CC BY 4.0)
- Animation inspiration from [Awwwards](https://www.awwwards.com/)

## 📞 Support

For questions or support:
- Email: support@carevision.com
- Documentation: https://docs.carevision.com
- Discord: https://discord.gg/carevision

---

**Built with ❤️ by the CareVision Team**

Last Updated: May 2026
