# Pantry Manager - Less Waste, More Taste
## Senior Project at CSULB

We are a dedicated team of college students who experienced firsthand how difficult it can be to manage grocery spending, plan meals, and keep track of food before it goes to waste. In the beginning of 2025, we started the development of CHAVNA which is designed to help users stay organized and make smarter decisions while grocery shopping. Our app allows you to track your spending, plan meals based on what you already have, monitor expiration dates, and recude food wwaste. With a built-in receipt scanner, you can easily log purchases and see where your money goes, making everyday grocery management simpler.

---
## Features
- **Receipt Scanning**: Allows users to scan multiple items to put in their inventory rahter than scanning one at a time.
- **Grocery List**: Has automatic inputs when users run out of a certain item in their pantry. 
- **Expiration Tracking**: Receives notifications on when certain items are about to expire.
- **Household Collaboration**: Users join a household to share pantries, along with getting notifications on which items were used or purchased.
- **Unique and Modern UX/UI**: Engaging user interface design to enhance user experience.

## Technology Used

### Frontend
#### Languages
- **TypeScript**: A statically typed superset of JavaScript that improves code reliability and maintainability. Used to define interfaces and types for API responses, food items, meals, and component props.
- **JavaScript**: Used to build the application logic and UI behavior.

#### Frameworks & Platforms
- **React Native**: A cross-platform framework for building native mobile applications using JavaScript/TypeScript and React.
- **Expo**: A development platform built on top of React Native that simplifies setup and access to native device features.

#### Routing & Navigation
- **Expo Router**: A file-based routing system for React Native apps. It enables declarative navigation between screens using URL-like paths, simplifying navigation logic.

#### UI Components & Styling
- **React Native StyleSheet**: A styling system that allows developers to define layout, colors, spacing, and typography in JavaScript while optimizing performance.
- **React Native Safe Area Context**: Ensures that UI elements render within safe screen boundaries, avoiding notches, status bars, and system UI elements on modern devices.
- **Expo Vector Icons**: A comprehensive icon library that includes Ionicons, Feather, and MaterialIcons, used throughout the app for visual clarity and interaction cues.

#### Device & Native Features
- **Expo Camera**: Provides access to the device camera, including permission handling, autofocus, and image capture functionality for scanning features.

### Backend
- **Spring Boot**: A java framework that we used to create a REST api that recieves api calls and makes the appropriate queries to our database.
- **Neon**: A serverless postgres platform that we use to host our database.
- **AWS Elastic Beanstalk**: AWS service for hosting automatically scaling servers.
- **AWS SES**: AWS service for sending emails.
- **AWS Textract**: A machine learning OCR service used to extract text from images. We use this for scanning receipts.

---
## CHAVNA Creators
### Harry Cho
- 
### Brandon Huett
Brandon Huett worked primarily on the frontend, where he designed most of the user interface and implemented the majority of the Home Screen. He also integrated the backend with the frontend to ensure data was properly connected and displayed throughout the application.
### Brian Amsler - Lead Developer / Backend Engineer
Brian Amsler has extensive experience with various different programming languages and frameworks. Brian's main role was to design and implement the backend, including the database and REST API. He also helped by assisting in integrating the frontend with the backend.
### Daniella Vargas
Daniella Vargas has experience with various programming languages and frameworks. Daniella's main role was in the frontend and creating the meal page design. She has helped with the integration of the frontend with the backend for the meal and home screens.
### Thanh Nguyen
Thanh Nguyen has experience with various programming languages and frameworks. Thanh's main role was in the frontend and creating the setting and inventory design. He has helped with the integration of the frontend with the backend for the settings and pantry screens.
### Reza Amraei
Reza Amraei wrote most of the inventory section, created the UI for pantry screen, modal for create category, modal for opening food category, 
filtering within food category, swiping food entry left to delete, connecting template for frontend to add food to the database.

---
## Disclaimer
- This repository documents the development process of CHAVNA and highlights the core technologies and design decisions behind it. It is not intended for public deployment. For further details, feel free to review the code or reach out with questions.
