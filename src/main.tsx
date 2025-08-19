import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { Global, css } from '@emotion/react'

// Create a comprehensive theme that supports both dark and light modes
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#7f5af0', // Primary accent
      600: '#6366f1',
      700: '#4f46e5',
      800: '#4338ca',
      900: '#3730a3',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0d1117' : '#f8fafc',
        color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  components: {
    Input: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff',
            borderColor: props.colorMode === 'dark' ? '#4a5568' : '#e2e8f0',
            color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
            _placeholder: { 
              color: props.colorMode === 'dark' ? '#a0a0a0' : '#718096' 
            },
            _focus: { 
              borderColor: '#7f5af0',
              boxShadow: '0 0 0 1px #7f5af0',
              bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff'
            },
            _hover: { 
              borderColor: props.colorMode === 'dark' ? '#7f5af0' : '#cbd5e0' 
            }
          }
        })
      },
      defaultProps: {
        variant: 'filled'
      }
    },
    NumberInputField: {
      variants: {
        filled: (props: any) => ({
          bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff',
          borderColor: props.colorMode === 'dark' ? '#4a5568' : '#e2e8f0',
          color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
          _placeholder: { 
            color: props.colorMode === 'dark' ? '#a0a0a0' : '#718096' 
          },
          _focus: { 
            borderColor: '#7f5af0',
            boxShadow: '0 0 0 1px #7f5af0',
            bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff'
          },
          _hover: { 
            borderColor: props.colorMode === 'dark' ? '#7f5af0' : '#cbd5e0' 
          }
        })
      },
      defaultProps: {
        variant: 'filled'
      }
    },
    Select: {
      variants: {
        filled: (props: any) => ({
          field: {
            bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff',
            borderColor: props.colorMode === 'dark' ? '#4a5568' : '#e2e8f0',
            color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
            _focus: { 
              borderColor: '#7f5af0',
              boxShadow: '0 0 0 1px #7f5af0',
              bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff'
            },
            _hover: { 
              borderColor: props.colorMode === 'dark' ? '#7f5af0' : '#cbd5e0' 
            }
          }
        })
      },
      defaultProps: {
        variant: 'filled'
      }
    },
    Textarea: {
      variants: {
        filled: (props: any) => ({
          bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff',
          borderColor: props.colorMode === 'dark' ? '#4a5568' : '#e2e8f0',
          color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
          _placeholder: { 
            color: props.colorMode === 'dark' ? '#a0a0a0' : '#718096' 
          },
          _focus: { 
            borderColor: '#7f5af0',
            boxShadow: '0 0 0 1px #7f5af0',
            bg: props.colorMode === 'dark' ? '#2d3748' : '#ffffff'
          },
          _hover: { 
            borderColor: props.colorMode === 'dark' ? '#7f5af0' : '#cbd5e0' 
          }
        })
      },
      defaultProps: {
        variant: 'filled'
      }
    },
    FormLabel: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? '#e6e6e6' : '#2d3748',
        fontWeight: 'medium'
      })
    },
    FormHelperText: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? '#a0a0a0' : '#718096'
      })
    },
    Text: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c'
      })
    },
    Heading: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c'
      })
    },
    Badge: {
      baseStyle: (props: any) => ({
        color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c'
      })
    },
    Card: {
      baseStyle: (props: any) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'rgba(35, 37, 38, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: props.colorMode === 'dark' ? 'rgba(65, 67, 69, 0.5)' : 'rgba(226, 232, 240, 0.8)',
          backdropFilter: 'blur(10px)',
        }
      })
    },
    Modal: {
      baseStyle: (props: any) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'rgba(35, 37, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
        }
      })
    },
    Button: {
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === 'dark' ? '#7f5af0' : '#7f5af0',
          color: '#ffffff',
          _hover: {
            bg: props.colorMode === 'dark' ? '#6b46c1' : '#6b46c1',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(127, 90, 240, 0.3)',
          },
          _active: {
            bg: props.colorMode === 'dark' ? '#553c9a' : '#553c9a',
            transform: 'translateY(0)',
          }
        }),
        ghost: (props: any) => ({
          bg: 'transparent',
          color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
          _hover: {
            bg: props.colorMode === 'dark' ? 'rgba(127, 90, 240, 0.1)' : 'rgba(127, 90, 240, 0.1)',
          }
        }),
        outline: (props: any) => ({
          borderColor: props.colorMode === 'dark' ? 'rgba(65, 67, 69, 0.5)' : 'rgba(226, 232, 240, 0.8)',
          color: props.colorMode === 'dark' ? '#ffffff' : '#1a202c',
          bg: props.colorMode === 'dark' ? 'rgba(35, 37, 38, 0.9)' : 'rgba(248, 250, 252, 0.9)',
          _hover: {
            borderColor: '#7f5af0',
            bg: props.colorMode === 'dark' ? 'rgba(127, 90, 240, 0.1)' : 'rgba(127, 90, 240, 0.1)',
          }
        })
      }
    }
  }
})

const globalStyles = css`
  /* Theme-aware global styles */
  [data-theme="dark"] {
    --bg-primary: #0d1117;
    --bg-secondary: rgba(35, 37, 38, 0.9);
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --border-color: rgba(65, 67, 69, 0.5);
    --accent-color: #7f5af0;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --card-bg: rgba(35, 37, 38, 0.9);
    --input-bg: #2d3748;
    --input-border: #4a5568;
    --input-text: #ffffff;
    --input-placeholder: #a0a0a0;
  }

  [data-theme="light"] {
    --bg-primary: #f8fafc;
    --bg-secondary: rgba(255, 255, 255, 0.9);
    --text-primary: #1a202c;
    --text-secondary: #4a5568;
    --border-color: rgba(226, 232, 240, 0.8);
    --accent-color: #7f5af0;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --card-bg: rgba(255, 255, 255, 0.9);
    --input-bg: #ffffff;
    --input-border: #e2e8f0;
    --input-text: #1a202c;
    --input-placeholder: #718096;
  }

  /* Smooth transitions for theme switching */
  * {
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }

  /* Enhanced dashboard headings */
  .dashboard-heading {
    color: var(--text-primary) !important;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3) !important;
    filter: drop-shadow(0 0 4px rgba(0,0,0,0.2)) !important;
  }
  
  .dashboard-subtitle {
    color: var(--text-secondary) !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2) !important;
  }

  /* Enhanced input field styling */
  input, select, textarea {
    color: var(--input-text) !important;
    background-color: var(--input-bg) !important;
    border-color: var(--input-border) !important;
  }

  input::placeholder, textarea::placeholder {
    color: var(--input-placeholder) !important;
  }

  /* Card styling */
  .chakra-card {
    background-color: var(--card-bg) !important;
    border-color: var(--border-color) !important;
  }

  /* Modal content */
  .chakra-modal__content {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
  }

  /* Button enhancements */
  .chakra-button {
    transition: all 0.2s ease-in-out !important;
  }

  .chakra-button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(127, 90, 240, 0.3) !important;
  }

  /* Enhanced shadows and effects */
  .chakra-card, .chakra-modal__content {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  }

  /* Gradient backgrounds */
  .gradient-bg {
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 60%, var(--accent-color) 100%) !important;
  }

  /* Glass morphism effect */
  .glass-effect {
    backdrop-filter: blur(10px) !important;
    background: var(--card-bg) !important;
    border: 1px solid var(--border-color) !important;
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
