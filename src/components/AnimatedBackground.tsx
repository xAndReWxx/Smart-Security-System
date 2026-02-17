import React from 'react';
import { motion } from 'framer-motion';
export function AnimatedBackground() {
  return <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),rgba(2,6,23,1))]" />

      {/* Moving Grid - Perspective Effect */}
      <div className="absolute inset-0 opacity-20" style={{
      perspective: '1000px',
      transformStyle: 'preserve-3d'
    }}>
        <motion.div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" style={{
        transform: 'rotateX(60deg)',
        transformOrigin: 'center 40%'
      }} animate={{
        y: [0, 64]
      }} transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }} />
      </div>

      {/* Floating Particles */}
      {Array.from({
      length: 20
    }).map((_, i) => <motion.div key={i} className="absolute rounded-full bg-cyan-500/30 blur-[1px]" style={{
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`
    }} animate={{
      y: [0, -100],
      opacity: [0, 0.8, 0],
      scale: [0, 1.5, 0]
    }} transition={{
      duration: Math.random() * 5 + 5,
      repeat: Infinity,
      delay: Math.random() * 5,
      ease: 'linear'
    }} />)}

      {/* Scanning Light Beam */}
      <motion.div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent" animate={{
      top: ['-100%', '100%']
    }} transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'linear'
    }} />
    </div>;
}