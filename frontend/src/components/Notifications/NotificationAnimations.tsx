import React from 'react';
import { keyframes, styled } from '@mui/material';

// Core animation keyframes
export const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

export const slideInUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const slideInDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const bounceIn = keyframes`
  0% {
    transform: scale(0.3);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
`;

export const bellShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-15deg); }
  20%, 40%, 60%, 80% { transform: rotate(15deg); }
`;

export const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.8), 0 0 30px rgba(25, 118, 210, 0.4);
  }
`;

export const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

export const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

export const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
`;

export const rotateIn = keyframes`
  from {
    transform: rotate(-200deg);
    opacity: 0;
  }
  to {
    transform: rotate(0deg);
    opacity: 1;
  }
`;

export const heartbeat = keyframes`
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.3);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.3);
  }
  70% {
    transform: scale(1);
  }
`;

export const typewriter = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

export const blink = keyframes`
  from, to {
    border-color: transparent;
  }
  50% {
    border-color: currentColor;
  }
`;

export const progressSweep = keyframes`
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
`;

export const morphBounce = keyframes`
  0% {
    border-radius: 50%;
    transform: scale(1) rotate(0deg);
  }
  25% {
    border-radius: 40% 60%;
    transform: scale(1.1) rotate(90deg);
  }
  50% {
    border-radius: 30% 70%;
    transform: scale(1.2) rotate(180deg);
  }
  75% {
    border-radius: 40% 60%;
    transform: scale(1.1) rotate(270deg);
  }
  100% {
    border-radius: 50%;
    transform: scale(1) rotate(360deg);
  }
`;

export const neonGlow = keyframes`
  0%, 100% {
    text-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor,
      0 0 20px currentColor;
  }
  50% {
    text-shadow: 
      0 0 2px currentColor,
      0 0 5px currentColor,
      0 0 8px currentColor,
      0 0 12px currentColor;
  }
`;

export const liquidWave = keyframes`
  0% {
    clip-path: polygon(0% 45%, 15% 44%, 32% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
  }
  50% {
    clip-path: polygon(0% 60%, 16% 65%, 34% 66%, 51% 62%, 67% 50%, 84% 45%, 100% 46%, 100% 100%, 0% 100%);
  }
  100% {
    clip-path: polygon(0% 45%, 15% 44%, 32% 50%, 54% 60%, 70% 61%, 84% 59%, 100% 52%, 100% 100%, 0% 100%);
  }
`;

// Animation timing functions
export const easing = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  back: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Animation durations (in milliseconds)
export const duration = {
  shortest: 150,
  shorter: 200,
  short: 250,
  standard: 300,
  complex: 375,
  entering: 225,
  leaving: 195,
  slow: 500,
  slower: 750,
  slowest: 1000,
};

// Utility function to create staggered animations
export const createStaggeredAnimation = (
  baseDelay: number = 0,
  increment: number = 100,
  maxDelay: number = 1000
) => {
  return (index: number) => Math.min(baseDelay + index * increment, maxDelay);
};

// Utility function to create random delays for organic feel
export const createRandomDelay = (min: number = 0, max: number = 500) => {
  return Math.random() * (max - min) + min;
};

// Prebuilt animation variants
export const animationVariants = {
  notification: {
    enter: {
      animation: `${slideInRight} ${duration.standard}ms ${easing.easeOut}`,
    },
    exit: {
      animation: `${slideOutRight} ${duration.shorter}ms ${easing.easeIn}`,
    },
  },
  badge: {
    appear: {
      animation: `${bounceIn} ${duration.complex}ms ${easing.bounce}`,
    },
    pulse: {
      animation: `${pulse} ${duration.slow}ms ${easing.easeInOut} infinite`,
    },
  },
  button: {
    hover: {
      transition: `all ${duration.shorter}ms ${easing.easeOut}`,
      transform: 'translateY(-2px)',
    },
    press: {
      transition: `all ${duration.shortest}ms ${easing.sharp}`,
      transform: 'scale(0.95)',
    },
  },
  modal: {
    enter: {
      animation: `${fadeInScale} ${duration.complex}ms ${easing.easeOut}`,
    },
    exit: {
      animation: `${fadeInScale} ${duration.shorter}ms ${easing.easeIn} reverse`,
    },
  },
};

export default {
  slideInRight,
  slideOutRight,
  slideInUp,
  slideInDown,
  fadeInScale,
  bounceIn,
  pulse,
  shake,
  bellShake,
  glow,
  ripple,
  shimmer,
  float,
  rotateIn,
  heartbeat,
  typewriter,
  blink,
  progressSweep,
  morphBounce,
  neonGlow,
  liquidWave,
  easing,
  duration,
  createStaggeredAnimation,
  createRandomDelay,
  animationVariants,
};