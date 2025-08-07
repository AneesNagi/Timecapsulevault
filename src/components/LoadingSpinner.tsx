import React from 'react';
import { Spinner, Box, Text, VStack } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'pulse' | 'dots';
  text?: string;
  color?: string;
}

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const dotsAnimation = keyframes`
  0%, 20% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  80%, 100% { transform: translateY(0); }
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  color = 'blue.500'
}) => {
  if (variant === 'pulse') {
    return (
      <VStack spacing={3}>
        <Box
          animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
          borderRadius="full"
          bg={color}
          width={size === 'xs' ? '20px' : size === 'sm' ? '30px' : size === 'md' ? '40px' : size === 'lg' ? '50px' : '60px'}
          height={size === 'xs' ? '20px' : size === 'sm' ? '30px' : size === 'md' ? '40px' : size === 'lg' ? '50px' : '60px'}
        />
        {text && <Text fontSize="sm" color="gray.500">{text}</Text>}
      </VStack>
    );
  }

  if (variant === 'dots') {
    return (
      <VStack spacing={3}>
        <Box display="flex" gap={2}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              animation={`${dotsAnimation} 1.4s ease-in-out infinite`}
              sx={{ animationDelay: `${i * 0.2}s` }}
              width="8px"
              height="8px"
              borderRadius="full"
              bg={color}
            />
          ))}
        </Box>
        {text && <Text fontSize="sm" color="gray.500">{text}</Text>}
      </VStack>
    );
  }

  return (
    <VStack spacing={3}>
      <Spinner size={size} color={color} thickness="3px" />
      {text && <Text fontSize="sm" color="gray.500">{text}</Text>}
    </VStack>
  );
}; 