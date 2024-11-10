import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AudiobookList from './pages/AudiobookList';
import AudiobookDetail from './pages/AudiobookDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AudiobookList />} />
        <Route path="/book/:id" element={<AudiobookDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}