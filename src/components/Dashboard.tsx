import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Progress,
  Badge,
  useColorModeValue,
  Icon,
  HStack,
  Select,
  Grid,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { 
  FaWallet, 
  FaLock, 
  FaCheckCircle,
  FaClock,
  FaBullseye
} from 'react-icons/fa';
import { useVault } from '../hooks/useVault';
import { NetworkContext } from './DAppLayout';
import { formatEther } from 'ethers';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

interface PortfolioData {
  totalValue: number;
  totalLocked: number;
  totalUnlocked: number;
  totalVaults: number;
  activeGoals: number;
  completedGoals: number;
  avgLockDuration: number;
  successRate: number;
}

interface GoalProgress {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  category: string;
  deadline?: Date;
  status: 'active' | 'completed' | 'overdue';
}

interface PerformanceData {
  date: string;
  totalValue: number;
  locked: number;
  unlocked: number;
  goals: number;
}

export const Dashboard = () => {
  const { vaults } = useVault();
  const { network: selectedNetwork } = useContext(NetworkContext);
  const [timeframe, setTimeframe] = useState('30d');


  const getCurrencyName = () => {
    return selectedNetwork.currency;
  };
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const bgColor = 'var(--bg-primary)';
  const cardBg = 'var(--card-bg)';
  const borderColor = 'var(--border-color)';
  const textColor = 'var(--text-primary)';
  const mutedTextColor = 'var(--text-secondary)';

  // Calculate portfolio statistics
  useEffect(() => {
    if (vaults.length > 0) {
      const totalValue = vaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      const lockedVaults = vaults.filter(v => v.isLocked);
      const unlockedVaults = vaults.filter(v => !v.isLocked);
      const goalVaults = vaults.filter(v => v.isGoalLocked);
      
      const totalLocked = lockedVaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      const totalUnlocked = unlockedVaults.reduce((sum, vault) => sum + Number(formatEther(vault.balance)), 0);
      
      const avgLockDuration = vaults.length > 0 
        ? vaults.reduce((sum, vault) => sum + vault.remainingTime, 0) / vaults.length / 86400 // Convert to days
        : 0;

      const completedGoals = goalVaults.filter(v => v.progressPercentage >= 100).length;
      const successRate = goalVaults.length > 0 ? (completedGoals / goalVaults.length) * 100 : 0;

      setPortfolioData({
        totalValue,
        totalLocked,
        totalUnlocked,
        totalVaults: vaults.length,
        activeGoals: goalVaults.filter(v => v.progressPercentage < 100).length,
        completedGoals,
        avgLockDuration,
        successRate,
      });

      // Generate goal progress data
      const goals: GoalProgress[] = goalVaults.map((vault, index) => ({
        id: vault.address,
        name: `Goal Vault #${index + 1}`,
        currentValue: Number(formatEther(vault.currentAmount || 0n)),
        targetValue: Number(formatEther(vault.goalAmount || 0n)),
        progress: vault.progressPercentage,
        category: vault.isTimeLocked ? 'Time-based' : vault.isPriceLocked ? 'Price-based' : 'Goal-based',
        status: vault.progressPercentage >= 100 ? 'completed' : 'active',
      }));

      setGoalProgress(goals);

      // Generate mock performance data (in real app, this would come from historical data)
      const mockPerformanceData: PerformanceData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          totalValue: totalValue * (0.8 + (i / 30) * 0.4 + Math.random() * 0.1),
          locked: totalLocked * (0.9 + Math.random() * 0.2),
          unlocked: totalUnlocked * (0.7 + Math.random() * 0.6),
          goals: goalVaults.length * (0.5 + (i / 30) * 0.5),
        };
      });

      setPerformanceData(mockPerformanceData);
    }
  }, [vaults]);

  const pieData = [
    { name: 'Locked Funds', value: portfolioData?.totalLocked || 0, color: 'var(--accent-color)' },
    { name: 'Unlocked Funds', value: portfolioData?.totalUnlocked || 0, color: 'var(--success-color)' },
  ];



  return (
    <Box minH="100vh" className="gradient-bg">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Flex justify="space-between" align="center" mb={6}>
            <VStack align="start" spacing={0}>
              <Box
                bg="rgba(0,0,0,0.3)"
                p={3}
                borderRadius="md"
                border="1px solid rgba(255,255,255,0.1)"
              >
                <Heading
                  as="h1"
                  size="xl"
                  fontWeight="bold"
                  fontSize="2xl"
                  color="white"
                  className="dashboard-heading"
                  sx={{
                    color: 'white !important',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: 'inherit',
                    lineHeight: '1.2',
                    WebkitTextFillColor: 'white',
                    WebkitTextStroke: '1px rgba(0,0,0,0.5)',
                    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                    _dark: {
                      color: 'white !important',
                      WebkitTextFillColor: 'white',
                    },
                    _light: {
                      color: 'black !important',
                      WebkitTextFillColor: 'black',
                    }
                  }}
                >
                  Portfolio Dashboard
                </Heading>
              </Box>
              <Text
                color="white"
                fontSize="md"
                mt={2}
                className="dashboard-subtitle"
                sx={{
                  color: 'white !important',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  _dark: {
                    color: 'white !important',
                  },
                  _light: {
                    color: 'black !important',
                  }
                }}
              >
                Track your savings goals and vault performance.
              </Text>
            </VStack>
            <Select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)} 
              w="200px"
              bg="#161b22"
              color="#f0f6fc"
              borderColor="#30363d"
              border="1px solid #30363d"
              _hover={{ borderColor: "#7f5af0", bg: "#161b22" }}
              _focus={{ borderColor: "#7f5af0", boxShadow: "0 0 0 1px #7f5af0", bg: "#161b22" }}
              sx={{
                '& option': {
                  backgroundColor: '#161b22',
                  color: '#f0f6fc'
                }
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </Select>
          </Flex>
        </MotionBox>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaWallet} />
                    <Text>Total Portfolio Value</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.totalValue.toFixed(4) || '0'} {getCurrencyName()}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  +12.3% this month
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaLock} />
                    <Text>Active Vaults</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.totalVaults || 0}
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="purple">{portfolioData?.totalLocked.toFixed(4) || '0'} {getCurrencyName()} locked</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaBullseye} />
                    <Text>Goal Success Rate</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.successRate.toFixed(1) || '0'}%
                </StatNumber>
                <StatHelpText>
                  <Badge colorScheme="green">{portfolioData?.completedGoals || 0} completed</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color={mutedTextColor} fontSize="sm">
                  <HStack>
                    <Icon as={FaClock} />
                    <Text>Avg. Lock Duration</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={textColor} fontSize="2xl">
                  {portfolioData?.avgLockDuration.toFixed(0) || '0'}d
                </StatNumber>
                <StatHelpText>
                  <Text color={mutedTextColor}>days remaining</Text>
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>

        {/* Charts Section */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Performance Chart */}
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardHeader>
              <Heading size="md" color={textColor}>Portfolio Performance</Heading>
            </CardHeader>
            <CardBody>
              <Box h="300px" w="100%" minH="300px" position="relative">
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis dataKey="date" stroke="#8b949e" />
                      <YAxis stroke="#8b949e" />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="totalValue" 
                        stackId="1"
                        stroke="#7f5af0" 
                        fill="#7f5af0" 
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="locked" 
                        stackId="2"
                        stroke="#2cb67d" 
                        fill="#2cb67d" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Center height="100%">
                    <Spinner size="lg" color="purple.500" />
                  </Center>
                )}
              </Box>
            </CardBody>
          </MotionCard>

          {/* Portfolio Distribution */}
          <MotionCard
            bg={cardBg}
            borderColor={borderColor}
            borderWidth="1px"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CardHeader>
              <Heading size="md" color={textColor}>Fund Distribution</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <Box h="200px" w="100%" minH="200px" position="relative">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Center height="100%">
                      <Spinner size="lg" color="purple.500" />
                    </Center>
                  )}
                </Box>
                <VStack spacing={2} w="100%">
                  {pieData.map((item, index) => (
                    <HStack key={index} justify="space-between" w="100%">
                      <HStack>
                        <Box w={3} h={3} bg={item.color} borderRadius="sm" />
                        <Text fontSize="sm" color={mutedTextColor}>{item.name}</Text>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>{item.value.toFixed(4)} {getCurrencyName()}</Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </MotionCard>
        </Grid>

        {/* Goals Progress Section */}
        <MotionCard
          bg={cardBg}
          borderColor={borderColor}
          borderWidth="1px"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md" color={textColor}>Active Goals Progress</Heading>
              <Badge colorScheme="purple">{goalProgress.filter(g => g.status === 'active').length} active</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {goalProgress.length === 0 ? (
                <Text color={mutedTextColor} textAlign="center" py={8}>
                  No goals found. Create your first goal-based vault to start tracking progress!
                </Text>
              ) : (
                goalProgress.map((goal) => (
                  <Box key={goal.id} p={4} bg="rgba(0,0,0,0.2)" borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" color={textColor}>{goal.name}</Text>
                        <Badge colorScheme={goal.status === 'completed' ? 'green' : 'orange'}>
                          {goal.category}
                        </Badge>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          {goal.progress.toFixed(1)}%
                        </Text>
                        <Text fontSize="sm" color={mutedTextColor}>
                          {goal.currentValue.toFixed(4)} / {goal.targetValue.toFixed(4)} {getCurrencyName()}
                        </Text>
                      </VStack>
                    </HStack>
                    <Progress 
                      value={goal.progress} 
                      colorScheme={goal.status === 'completed' ? 'green' : 'purple'}
                      borderRadius="full"
                      h={2}
                    />
                    {goal.status === 'completed' && (
                      <HStack mt={2}>
                        <Icon as={FaCheckCircle} color="green.400" />
                        <Text fontSize="sm" color="green.400">Goal achieved!</Text>
                      </HStack>
                    )}
                  </Box>
                ))
              )}
            </VStack>
          </CardBody>
        </MotionCard>
      </VStack>
    </Container>
    </Box>
  );
};

export default Dashboard; 