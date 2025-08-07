import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import React from 'react' // Not needed in React 17+ with new JSX transform

import DAppLayout from './components/DAppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
// import { NotificationsHandler } from './components/NotificationsHandler'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          {/* <NotificationsHandler /> */}
          <Routes>
            {/* DApp Routes - All under root path */}
            <Route path="/*" element={<DAppLayout />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App