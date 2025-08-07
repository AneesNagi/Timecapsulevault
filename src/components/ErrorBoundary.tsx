import { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="#181a20"
          p={4}
        >
          <VStack spacing={6} maxW="500px" textAlign="center">
            <Box
              p={6}
              bg="rgba(35, 37, 38, 0.9)"
              borderRadius="xl"
              border="1px solid"
              borderColor="#4a5568"
              boxShadow="xl"
            >
              <VStack spacing={4}>
                <Box
                  p={4}
                  borderRadius="full"
                  bg="red.500"
                  color="white"
                  fontSize="2xl"
                >
                  <FaExclamationTriangle />
                </Box>
                
                <Heading size="lg" color="#ffffff">
                  Oops! Something went wrong
                </Heading>
                
                <Text color="#a0a0a0" fontSize="sm">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </Text>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Error Details (Development)</AlertTitle>
                      <AlertDescription fontSize="xs" fontFamily="mono">
                        {this.state.error.message}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <VStack spacing={3} w="full">
                  <Button
                    leftIcon={<FaRedo />}
                    colorScheme="blue"
                    onClick={this.handleRetry}
                    w="full"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    leftIcon={<FaHome />}
                    variant="outline"
                    onClick={this.handleGoHome}
                    w="full"
                    borderColor="#4a5568"
                    color="#ffffff"
                    _hover={{ bg: 'rgba(74, 85, 104, 0.2)' }}
                  >
                    Go to Home
                  </Button>
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
} 