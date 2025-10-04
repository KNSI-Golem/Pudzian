# GOLEM - AI Pose Detection App

A modern Next.js application for real-time pose detection using MediaPipe, built with TypeScript and following Next.js 15+ best practices.

## Project Structure

```
src/
├── app/                     # Next.js App Router
│   ├── globals.css         # Global styles and CSS variables
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Home page component
├── components/             # Reusable components
│   ├── ui/                 # Basic UI components
│   │   ├── Button.tsx      # Reusable button component
│   │   ├── ViewPanel.tsx   # Panel container component
│   │   ├── AwakeningGrid.tsx # Animated grid component
│   │   └── index.ts        # UI components export
│   ├── layout/             # Layout-specific components
│   │   ├── Header.tsx      # Application header
│   │   ├── Footer.tsx      # Application footer
│   │   └── index.ts        # Layout components export
│   ├── video/              # Video and camera components
│   │   ├── VideoStream.tsx # Main video streaming component
│   │   ├── VideoCanvas.tsx # Canvas for video rendering
│   │   ├── CameraPlaceholder.tsx # Placeholder when camera is off
│   │   ├── usePoseDetection.ts # Pose detection hook
│   │   └── index.ts        # Video components export
│   └── index.ts            # All components export
├── hooks/                  # Custom React hooks
│   ├── useMediaPipe.ts     # MediaPipe initialization hook
│   ├── useVideoStream.ts   # Video stream management hook
│   └── index.ts            # Hooks export
├── lib/                    # Utilities and configurations
│   ├── mediapipe/          # MediaPipe utilities
│   │   ├── core.ts         # Core MediaPipe functions
│   │   ├── drawing.ts      # Canvas drawing utilities
│   │   ├── video.ts        # Video stream utilities
│   │   └── index.ts        # MediaPipe exports
│   ├── constants.ts        # Application constants
│   ├── utils.ts            # General utility functions
│   ├── metadata.ts         # Next.js metadata helpers
│   └── index.ts            # Lib exports
├── types/                  # TypeScript type definitions
│   ├── mediapipe.ts        # MediaPipe-related types
│   ├── ui.ts               # UI component types
│   └── index.ts            # Types export
└── styles/                 # Additional styles
    └── components.css      # Component-specific styles
```

## Architecture Principles

### 1. **Modular Component Design**
- Components are broken down into small, focused modules
- Each component has a single responsibility
- Components are reusable and composable

### 2. **Custom Hooks for Logic Separation**
- Business logic is separated from UI components
- Hooks handle MediaPipe initialization, video streaming, and pose detection
- Promotes reusability and testability

### 3. **TypeScript-First Development**
- Comprehensive type definitions for all interfaces
- Type safety for MediaPipe integration
- Proper typing for React components and hooks

### 4. **Next.js Best Practices**
- Uses App Router (Next.js 13+)
- Proper file organization following Next.js conventions
- Path aliases configured for clean imports (`@/`)
- Server and client components separation

### 5. **Performance Optimizations**
- RequestAnimationFrame for smooth pose detection
- Proper cleanup of MediaPipe resources
- Debounced operations where appropriate
- Efficient canvas rendering

## Key Features

### MediaPipe Integration
- Real-time pose detection using MediaPipe Pose Landmarker
- GPU acceleration when available
- Proper error handling and fallbacks
- Configurable detection parameters

### Video Streaming
- WebRTC camera access
- Support for different video configurations
- Proper stream cleanup and error handling
- Browser compatibility checks

### UI Components
- Animated awakening grid for visual feedback
- Responsive design for different screen sizes
- Polish language support
- Accessible button and panel components

## Development Guidelines

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react';
import Image from 'next/image';

// 2. Third-party libraries
import { PoseLandmarker } from '@mediapipe/tasks-vision';

// 3. Internal imports (using path aliases)
import { useMediaPipe } from '@/hooks';
import { Button } from '@/components/ui';
import type { VideoStreamConfig } from '@/types';
```

### Component Structure
```typescript
// 1. Type definitions
interface ComponentProps {
  // props definition
}

// 2. Component implementation
export function Component({ prop }: ComponentProps) {
  // hooks
  // state
  // effects
  // handlers
  // render
}
```

### Error Handling
- All async operations have proper error handling
- User-friendly error messages
- Fallback UI states for error conditions
- Console logging for debugging

### Performance Considerations
- Components use `useCallback` and `useMemo` where appropriate
- MediaPipe resources are properly cleaned up
- Animation frames are cancelled when components unmount
- Video streams are stopped when not needed

## Browser Support
- Modern browsers with WebRTC support
- MediaPipe WASM compatibility
- ES2017+ features

## Future Enhancements
- Pose analysis and posture recommendations
- Multiple camera support
- Recording and playback features
- WebRTC peer-to-peer connections
- Real-time pose sharing

This architecture provides a solid foundation for scaling the application while maintaining code quality and performance.