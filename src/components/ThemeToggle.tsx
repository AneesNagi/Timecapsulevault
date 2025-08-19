import React from 'react';
import {
  IconButton,
  useColorModeValue,
  Tooltip,
  Icon,
  Box,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'md', 
  variant = 'ghost' 
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const bgColor = useColorModeValue('rgba(35, 37, 38, 0.9)', 'rgba(255, 255, 255, 0.9)');
  const borderColor = useColorModeValue('rgba(65, 67, 69, 0.5)', 'rgba(226, 232, 240, 0.8)');
  const textColor = useColorModeValue('#ffffff', '#1a202c');
  const hoverBg = useColorModeValue('rgba(127, 90, 240, 0.1)', 'rgba(127, 90, 240, 0.1)');
  const iconColor = useColorModeValue('#fbbf24', '#f59e0b');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.05)');

  return (
    <Tooltip 
      hasArrow 
      label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      placement="bottom"
      bg={useColorModeValue('gray.800', 'gray.200')}
      color={useColorModeValue('white', 'gray.800')}
    >
      <IconButton
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        icon={
          <Box position="relative">
            <Icon
              as={isDarkMode ? FaSun : FaMoon}
              boxSize={size === 'sm' ? 4 : size === 'lg' ? 6 : 5}
              color={iconColor}
              animation={`
                ${fadeIn} 0.3s ease-out,
                ${isDarkMode ? rotate : pulse} 0.5s ease-in-out
              `}
            />
          </Box>
        }
        size={size}
        variant={variant}
        onClick={toggleTheme}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        color={textColor}
        borderRadius="lg"
        backdropFilter="blur(10px)"
        boxShadow={`0 2px 8px ${shadowColor}`}
        _hover={{
          bg: hoverBg,
          borderColor: 'var(--accent-color)',
          transform: 'scale(1.05)',
          boxShadow: `0 4px 12px ${shadowColor}, 0 0 0 1px var(--accent-color)`,
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.2s ease-in-out"
        _focus={{
          boxShadow: '0 0 0 3px rgba(127, 90, 240, 0.3)',
        }}
      />
    </Tooltip>
  );
}; 