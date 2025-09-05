import { useState, useEffect, useContext, useRef } from 'react';
import { Box, Heading, Text, Spinner, Center, useColorModeValue } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { NetworkContext } from '../DAppLayout';

interface PriceChartProps {
  targetPrice: number;
  currentPrice: number;
  isPriceLocked: boolean;
}

interface PriceData {
  timestamp: number;
  price: number;
}

const PriceChart = ({ targetPrice, currentPrice, isPriceLocked }: PriceChartProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { network: selectedNetwork } = useContext(NetworkContext);
  
  const lineColor = useColorModeValue('purple.500', 'purple.300');
  const gridColor = useColorModeValue('gray.200', 'gray.600');
  const referenceLineColor = useColorModeValue('red.500', 'red.300');
  const boxBg = useColorModeValue('white', 'gray.700');
  const xAxisStroke = useColorModeValue('gray.500', 'gray.400');
  const yAxisStroke = useColorModeValue('gray.500', 'gray.400');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Helper function for dynamic currency display
  const getAssetName = () => 'ETH';

  // Check if container is ready for chart rendering
  useEffect(() => {
    const checkContainerSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setContainerReady(true);
        }
      }
    };

    // Check immediately
    checkContainerSize();

    // Check after a short delay to ensure DOM is ready
    const timer = setTimeout(checkContainerSize, 100);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(checkContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []);
  
  // Fetch historical price data
  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        
        // For now, we'll generate mock data
        // In a production app, you would fetch this from an API like CoinGecko
        const mockData: PriceData[] = [];
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        // Generate 14 days of mock data
        for (let i = 14; i >= 0; i--) {
          const timestamp = now - (i * oneDayMs);
          // Create some variation around the current price
          const randomFactor = 0.9 + (Math.random() * 0.2); // Between 0.9 and 1.1
          const price = currentPrice * randomFactor;
          mockData.push({ timestamp, price });
        }
        
        setPriceHistory(mockData);
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load price history data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPriceHistory();
  }, [currentPrice]);
  
  // Custom tooltip formatter
  const formatTooltip = (value: number) => {
    return [`$${value.toFixed(2)}`, `${getAssetName()} Price`];
  };
  
  // Date formatter for X-axis
  const formatXAxis = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd');
  };
  
  if (isLoading) {
    return (
      <Box p={4} borderRadius="lg" bg={boxBg} shadow="sm" mb={6}>
        <Heading size="md" mb={4}>{getAssetName()} Price History</Heading>
        <Center py={10}>
          <Spinner size="xl" color="purple.500" />
        </Center>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box p={4} borderRadius="lg" bg={boxBg} shadow="sm" mb={6}>
        <Heading size="md" mb={4}>{getAssetName()} Price History</Heading>
        <Center py={10}>
          <Text color="red.500">{error}</Text>
        </Center>
      </Box>
    );
  }
  
  return (
    <Box p={4} borderRadius="lg" bg={boxBg} shadow="sm" mb={6}>
      <Heading size="md" mb={4}>{getAssetName()} Price History</Heading>
      
      <Box 
        ref={containerRef}
        height="300px" 
        width="100%"
        minHeight="300px"
        position="relative"
      >
        {containerReady && priceHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceHistory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis} 
                stroke={xAxisStroke}
              />
              <YAxis 
                domain={['auto', 'auto']}
                stroke={yAxisStroke}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={lineColor} 
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Target price reference line */}
              {isPriceLocked && (
                <ReferenceLine 
                  y={targetPrice / 1e8} 
                  stroke={referenceLineColor} 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Target: $${(targetPrice / 1e8).toFixed(2)}`,
                    position: 'insideTopRight',
                    fill: referenceLineColor,
                    fontSize: 12
                  }}
                />
              )}
              
              {/* Current price reference line */}
              <ReferenceLine 
                y={currentPrice / 1e8} 
                stroke="green" 
                strokeDasharray="3 3"
                label={{ 
                  value: `Current: $${(currentPrice / 1e8).toFixed(2)}`,
                  position: 'insideBottomRight',
                  fill: 'green',
                  fontSize: 12
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Center height="100%">
            <Spinner size="lg" color="purple.500" />
          </Center>
        )}
      </Box>
      
      {isPriceLocked && (
        <Text fontSize="sm" mt={2} color={textColor}>
          {targetPrice > currentPrice 
            ? `${getAssetName()} needs to increase by $${((targetPrice - currentPrice) / 1e8).toFixed(2)} to unlock this vault.`
            : 'Target price reached! Vault can be unlocked.'}
        </Text>
      )}
    </Box>
  );
};

export default PriceChart; 