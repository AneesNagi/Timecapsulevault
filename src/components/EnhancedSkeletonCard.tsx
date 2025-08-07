import React from 'react';
import {
  Box,
  Skeleton,
  SkeletonText,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

interface EnhancedSkeletonCardProps {
  variant?: 'wallet' | 'vault' | 'transaction' | 'dashboard';
  index?: number;
  height?: string;
}

const shimmerAnimation = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

export const EnhancedSkeletonCard: React.FC<EnhancedSkeletonCardProps> = ({
  variant = 'wallet',
  index = 0,
  height = '200px'
}) => {
  const shimmerBg = `linear-gradient(90deg, 
    rgba(74, 85, 104, 0.1) 25%, 
    rgba(74, 85, 104, 0.2) 50%, 
    rgba(74, 85, 104, 0.1) 75%
  )`;
  
  const animationDelay = `${index * 0.1}s`;

  if (variant === 'wallet') {
    return (
      <Box
        bg="rgba(35, 37, 38, 0.9)"
        border="1px solid"
        borderColor="#4a5568"
        borderRadius="xl"
        p={4}
        height={height}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: shimmerBg,
          backgroundSize: '200px 100%',
          animation: `${shimmerAnimation} 2s infinite linear`,
          animationDelay
        }}
      >
        <VStack spacing={4} align="stretch" height="full">
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Skeleton
                height="40px"
                width="40px"
                borderRadius="full"
                startColor="rgba(74, 85, 104, 0.3)"
                endColor="rgba(74, 85, 104, 0.6)"
              />
              <VStack align="start" spacing={1}>
                <Skeleton height="16px" width="80px" />
                <Skeleton height="12px" width="60px" />
              </VStack>
            </HStack>
            <Skeleton
              height="32px"
              width="32px"
              borderRadius="md"
              startColor="rgba(74, 85, 104, 0.3)"
              endColor="rgba(74, 85, 104, 0.6)"
            />
          </HStack>

          {/* Balance */}
          <VStack align="start" spacing={2}>
            <Skeleton height="14px" width="60px" />
            <Skeleton height="24px" width="120px" />
          </VStack>

          {/* Address */}
          <VStack align="start" spacing={1}>
            <Skeleton height="12px" width="100px" />
            <Skeleton height="16px" width="full" />
          </VStack>

          {/* Actions */}
          <HStack spacing={2} mt="auto">
            <Skeleton height="36px" flex={1} borderRadius="md" />
            <Skeleton height="36px" flex={1} borderRadius="md" />
          </HStack>
        </VStack>
      </Box>
    );
  }

  if (variant === 'vault') {
    return (
      <Box
        bg="rgba(35, 37, 38, 0.9)"
        border="1px solid"
        borderColor="#4a5568"
        borderRadius="xl"
        p={4}
        height={height}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: shimmerBg,
          backgroundSize: '200px 100%',
          animation: `${shimmerAnimation} 2s infinite linear`,
          animationDelay
        }}
      >
        <VStack spacing={4} align="stretch" height="full">
          {/* Status Bar */}
          <Skeleton
            height="4px"
            width="full"
            borderRadius="full"
            startColor="purple.400"
            endColor="blue.400"
          />

          {/* Header */}
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Skeleton height="18px" width="100px" />
              <Skeleton height="14px" width="80px" />
            </VStack>
            <Skeleton
              height="24px"
              width="60px"
              borderRadius="full"
            />
          </HStack>

          {/* Progress */}
          <VStack align="start" spacing={2}>
            <Skeleton height="12px" width="80px" />
            <Skeleton
              height="8px"
              width="full"
              borderRadius="full"
              startColor="rgba(74, 85, 104, 0.3)"
              endColor="rgba(74, 85, 104, 0.6)"
            />
            <Skeleton height="12px" width="60px" />
          </VStack>

          {/* Details */}
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" width="full">
              <Skeleton height="14px" width="60px" />
              <Skeleton height="14px" width="80px" />
            </HStack>
            <HStack justify="space-between" width="full">
              <Skeleton height="14px" width="70px" />
              <Skeleton height="14px" width="90px" />
            </HStack>
          </VStack>

          {/* Actions */}
          <HStack spacing={2} mt="auto">
            <Skeleton height="36px" flex={1} borderRadius="md" />
            <Skeleton height="36px" flex={1} borderRadius="md" />
          </HStack>
        </VStack>
      </Box>
    );
  }

  if (variant === 'transaction') {
    return (
      <Box
        bg="rgba(35, 37, 38, 0.9)"
        border="1px solid"
        borderColor="#4a5568"
        borderRadius="lg"
        p={3}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: shimmerBg,
          backgroundSize: '200px 100%',
          animation: `${shimmerAnimation} 2s infinite linear`,
          animationDelay
        }}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Skeleton
              height="32px"
              width="32px"
              borderRadius="full"
            />
            <VStack align="start" spacing={1}>
              <Skeleton height="14px" width="80px" />
              <Skeleton height="12px" width="60px" />
            </VStack>
          </HStack>
          <VStack align="end" spacing={1}>
            <Skeleton height="14px" width="70px" />
            <Skeleton height="12px" width="50px" />
          </VStack>
        </HStack>
      </Box>
    );
  }

  // Dashboard variant
  return (
    <Box
      bg="rgba(35, 37, 38, 0.9)"
      border="1px solid"
      borderColor="#4a5568"
      borderRadius="xl"
      p={6}
      height={height}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: shimmerBg,
        backgroundSize: '200px 100%',
        animation: `${shimmerAnimation} 2s infinite linear`,
        animationDelay
      }}
    >
      <VStack spacing={4} align="stretch" height="full">
        <Skeleton height="20px" width="120px" />
        <Skeleton height="32px" width="80px" />
        <SkeletonText noOfLines={3} spacing={2} />
        <Box flex={1} />
        <Skeleton height="40px" width="full" borderRadius="md" />
      </VStack>
    </Box>
  );
}; 