import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { Global, css } from '@emotion/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#0d1117',
        color: '#ffffff',
      },
    },
  },
  components: {
    Input: {
      defaultProps: {
        bg: '#2d3748',
        borderColor: '#4a5568',
        color: '#ffffff',
        _placeholder: { color: '#cccccc' },
        _focus: { 
          borderColor: '#7f5af0',
          boxShadow: '0 0 0 1px #7f5af0',
          bg: '#2d3748'
        },
        _hover: { borderColor: '#7f5af0' }
      }
    },
    NumberInputField: {
      defaultProps: {
        bg: '#2d3748',
        borderColor: '#4a5568',
        color: '#ffffff',
        _placeholder: { color: '#cccccc' },
        _focus: { 
          borderColor: '#7f5af0',
          boxShadow: '0 0 0 1px #7f5af0',
          bg: '#2d3748'
        },
        _hover: { borderColor: '#7f5af0' }
      }
    },
    Select: {
      defaultProps: {
        bg: '#2d3748',
        borderColor: '#4a5568',
        color: '#ffffff',
        _focus: { 
          borderColor: '#7f5af0',
          boxShadow: '0 0 0 1px #7f5af0',
          bg: '#2d3748'
        },
        _hover: { borderColor: '#7f5af0' }
      }
    },
    Textarea: {
      defaultProps: {
        bg: '#2d3748',
        borderColor: '#4a5568',
        color: '#ffffff',
        _placeholder: { color: '#cccccc' },
        _focus: { 
          borderColor: '#7f5af0',
          boxShadow: '0 0 0 1px #7f5af0',
          bg: '#2d3748'
        },
        _hover: { borderColor: '#7f5af0' }
      }
    },
    FormLabel: {
      defaultProps: {
        color: '#e6e6e6',
        fontWeight: 'medium'
      }
    },
    FormHelperText: {
      defaultProps: {
        color: '#a0a0a0'
      }
    },
    Text: {
      defaultProps: {
        color: '#ffffff'
      }
    },
    Heading: {
      defaultProps: {
        color: '#ffffff'
      }
    },
    Badge: {
      defaultProps: {
        color: '#ffffff'
      }
    }
  }
})

const globalStyles = css`
  .dashboard-heading {
    color: white !important;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
    -webkit-text-fill-color: white !important;
    -webkit-text-stroke: 1px rgba(0,0,0,0.5) !important;
    filter: drop-shadow(0 0 4px rgba(0,0,0,0.8)) !important;
  }
  
  .dashboard-subtitle {
    color: white !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
  }

  /* Enhanced input field visibility */
  input, select, textarea {
    color: #ffffff !important;
    background-color: #2d3748 !important;
    border-color: #4a5568 !important;
  }

  input::placeholder, textarea::placeholder {
    color: #cccccc !important;
  }

  /* Ensure all text is visible */
  .chakra-text, .chakra-heading, .chakra-form__label {
    color: #ffffff !important;
  }

  /* Card backgrounds */
  .chakra-card {
    background-color: rgba(35, 37, 38, 0.9) !important;
  }

  /* Modal content */
  .chakra-modal__content {
    background-color: rgba(35, 37, 38, 0.95) !important;
    color: #ffffff !important;
  }

  /* Force all text elements to be visible */
  * {
    color: inherit;
  }

  /* Specific text visibility fixes */
  .chakra-text, p, span, div, label, h1, h2, h3, h4, h5, h6 {
    color: #ffffff !important;
  }

  /* Form elements */
  .chakra-form__label, .chakra-form__helper-text {
    color: #e6e6e6 !important;
  }

  /* Input fields */
  .chakra-input, .chakra-select, .chakra-textarea {
    color: #ffffff !important;
    background-color: #2d3748 !important;
    border-color: #4a5568 !important;
  }

  /* Placeholder text */
  .chakra-input::placeholder, .chakra-textarea::placeholder {
    color: #cccccc !important;
  }

  /* Select options */
  .chakra-select option {
    color: #ffffff !important;
    background-color: #2d3748 !important;
  }

  /* Button text */
  .chakra-button {
    color: #ffffff !important;
  }

  /* Badge text */
  .chakra-badge {
    color: #ffffff !important;
  }

  /* Alert text */
  .chakra-alert {
    color: #ffffff !important;
  }

  /* Tooltip text */
  .chakra-tooltip {
    color: #ffffff !important;
  }

  /* Override any light text on dark backgrounds */
  [class*="chakra-"] {
    color: #ffffff !important;
  }

  /* Specific override for gray text */
  .chakra-text[class*="gray"], 
  .chakra-heading[class*="gray"],
  [class*="gray"][class*="chakra-"] {
    color: #ffffff !important;
  }


`

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Global styles={globalStyles} />
    <App />
    </ChakraProvider>
  </React.StrictMode>,
)
