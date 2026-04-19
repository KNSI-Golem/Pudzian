# Project GolemVR: user interface

## Description


Next.js application for GolemVR web interface. Move in front of your camera and see the Golem replicate your gestures.

## Installation 

1. **Navigate to the frontend folder**
   ```sh
   cd src/app/front
   ```

2. **Install dependencies**  
   ```sh
   npm install
   ```

4. **Run development server**
   ```sh
   npm run dev
   ```

### Supported browsers

- Chrome
- Safari

## Usage

Open your browser and navigate to localhost:3000 (if using default Next.js port). Make sure you are connected to the Internet, or else the pose detection model will not load. Click on "Aktywuj Golema" and accept webcam permissions. The left canvas will display the camera view and landmark overlay. The right canvas contains the animated Golem model.

