import React, { useState, useEffect } from 'react';
import { 
  ChakraProvider, 
  Box, 
  Container, 
  Heading, 
  Text, 
  Input, 
  Textarea, 
  Button, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  VStack, 
  HStack, 
  Badge, 
  useToast, 
  Spinner, 
  Card, 
  CardBody, 
  CardHeader,
  Link,
  Flex,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { InfoIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import axios from 'axios';

// API endpoint configuration - adjust for development or production
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [researchGoal, setResearchGoal] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, running, completed, error
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [statusPolling, setStatusPolling] = useState(null);
  const [error, setError] = useState(null);
  
  const toast = useToast();

  // Start the research process
  const startResearch = async () => {
    if (!researchGoal.trim()) {
      toast({
        title: 'Research goal required',
        description: 'Please enter a research goal to proceed.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!openaiKey.trim()) {
      toast({
        title: 'API Key required',
        description: 'Please enter your OpenAI API key to proceed.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setStatus('running');
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/start_research`, {
        research_goal: researchGoal,
        openai_api_key: openaiKey,
        serpapi_key: serpApiKey || null,
      });

      if (response.data.status === 'success') {
        setSessionId(response.data.session_id);
        // Start polling for updates
        startPolling(response.data.session_id);
        
        toast({
          title: 'Research started',
          description: 'The AI agents are now working on your research goal.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(response.data.message || 'Failed to start research');
      }
    } catch (error) {
      console.error('Error starting research:', error);
      setStatus('error');
      setError(error.message || 'An unexpected error occurred');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to start research process',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Poll for research status updates
  const startPolling = (sid) => {
    if (statusPolling) {
      clearInterval(statusPolling);
    }
    
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/research_status/${sid}`);
        
        if (response.data.status === 'success') {
          setLogs(response.data.logs || []);
          
          if (response.data.process_status === 'completed') {
            setStatus('completed');
            setResult(response.data.result);
            clearInterval(interval);
            setStatusPolling(null);
            
            toast({
              title: 'Research completed',
              description: 'The research process has been completed successfully.',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          } else if (response.data.process_status === 'error') {
            setStatus('error');
            setError('An error occurred during the research process');
            clearInterval(interval);
            setStatusPolling(null);
            
            toast({
              title: 'Research error',
              description: 'An error occurred during the research process.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (error) {
        console.error('Error polling research status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    setStatusPolling(interval);
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  // Filter logs by agent
  const getAgentLogs = (agentName) => {
    return logs.filter(log => log.agent && log.agent.includes(agentName));
  };

  // Get search logs
  const getSearchLogs = () => {
    return logs.filter(log => log.agent && log.agent.includes('Search'));
  };

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h1" size="xl">AI Co-Scientist Research Platform</Heading>
          <HStack>
            <Tooltip label="View on GitHub">
              <IconButton
                as={Link}
                href="https://github.com/yourusername/ai-co-scientist"
                isExternal
                icon={<ExternalLinkIcon />}
                aria-label="GitHub"
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Configuration</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={2}>OpenAI API Key (Required)</Text>
                <Input 
                  type="password" 
                  placeholder="Enter your OpenAI API key" 
                  value={openaiKey} 
                  onChange={(e) => setOpenaiKey(e.target.value)} 
                  isDisabled={status === 'running'}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Your API key is only sent to the backend and never stored
                </Text>
              </Box>
              
              <Box>
                <Text mb={2}>SerpAPI Key (Optional)</Text>
                <Input 
                  type="password" 
                  placeholder="Enter your SerpAPI key (optional)" 
                  value={serpApiKey} 
                  onChange={(e) => setSerpApiKey(e.target.value)} 
                  isDisabled={status === 'running'}
                />
                <HStack align="center" mt={1}>
                  <InfoIcon color="blue.400" boxSize={3} />
                  <Text fontSize="xs" color="gray.500">
                    Without SerpAPI, the system will rely primarily on arXiv for research data
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
        
        <Card mb={6}>
          <CardHeader>
            <Heading size="md">Research Goal</Heading>
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder="Enter your research goal (e.g., Investigate the potential applications of quantum computing in drug discovery)"
              value={researchGoal}
              onChange={(e) => setResearchGoal(e.target.value)}
              isDisabled={status === 'running'}
              minH="120px"
            />
            
            <Button 
              colorScheme="blue" 
              mt={4} 
              onClick={startResearch} 
              isLoading={status === 'running'} 
              loadingText="Processing"
              isDisabled={status === 'running'}
              width="full"
            >
              Start Research Process
            </Button>
            
            {error && (
              <Text color="red.500" mt={2}>
                Error: {error}
              </Text>
            )}
          </CardBody>
        </Card>
        
        <Tabs isLazy mt={8}>
          <TabList>
            <Tab>Research Progress</Tab>
            <Tab>Results</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <HStack spacing={4} align="flex-start">
                <Card flex="1">
                  <CardHeader>
                    <Heading size="sm">Generation Agent</Heading>
                  </CardHeader>
                  <CardBody maxH="400px" overflowY="auto">
                    {getAgentLogs('Generation').length > 0 ? (
                      getAgentLogs('Generation').map((log, index) => (
                        <Box key={index} mb={3} p={3} borderWidth="1px" borderRadius="md">
                          <Text fontSize="xs" color="gray.500">{log.timestamp}</Text>
                          <Text fontWeight="bold">{log.action}</Text>
                          <Text>{log.result}</Text>
                        </Box>
                      ))
                    ) : (
                      <Text color="gray.500">No activity yet</Text>
                    )}
                  </CardBody>
                </Card>
                
                <Card flex="1">
                  <CardHeader>
                    <Heading size="sm">Reflection Agent</Heading>
                  </CardHeader>
                  <CardBody maxH="400px" overflowY="auto">
                    {getAgentLogs('Reflection').length > 0 ? (
                      getAgentLogs('Reflection').map((log, index) => (
                        <Box key={index} mb={3} p={3} borderWidth="1px" borderRadius="md">
                          <Text fontSize="xs" color="gray.500">{log.timestamp}</Text>
                          <Text fontWeight="bold">{log.action}</Text>
                          <Text>{log.result}</Text>
                        </Box>
                      ))
                    ) : (
                      <Text color="gray.500">No activity yet</Text>
                    )}
                  </CardBody>
                </Card>
                
                <Card flex="1">
                  <CardHeader>
                    <Heading size="sm">Search Queries</Heading>
                  </CardHeader>
                  <CardBody maxH="400px" overflowY="auto">
                    {getSearchLogs().length > 0 ? (
                      getSearchLogs().map((log, index) => (
                        <Box key={index} mb={3} p={3} borderWidth="1px" borderRadius="md">
                          <Text fontSize="xs" color="gray.500">{log.timestamp}</Text>
                          <Text>{log.result}</Text>
                        </Box>
                      ))
                    ) : (
                      <Text color="gray.500">No search queries yet</Text>
                    )}
                  </CardBody>
                </Card>
              </HStack>
              
              {status === 'running' && (
                <Box textAlign="center" mt={6}>
                  <Spinner size="xl" />
                  <Text mt={2}>Research in progress...</Text>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel>
              <Card>
                <CardHeader>
                  <HStack>
                    <Heading size="md">Research Results</Heading>
                    {status === 'completed' && <Badge colorScheme="green">Completed</Badge>}
                    {status === 'error' && <Badge colorScheme="red">Error</Badge>}
                  </HStack>
                </CardHeader>
                <CardBody>
                  {status === 'completed' && result ? (
                    <Box 
                      whiteSpace="pre-wrap" 
                      p={4} 
                      borderWidth="1px" 
                      borderRadius="md"
                      overflowY="auto"
                      maxH="600px"
                    >
                      {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                    </Box>
                  ) : status === 'error' ? (
                    <Text color="red.500">An error occurred during the research process. Please check the logs for details.</Text>
                  ) : (
                    <Text color="gray.500">No research results available yet</Text>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Text fontSize="sm" color="gray.500" mt={8} textAlign="center">
          AI Co-Scientist Platform | © {new Date().getFullYear()}
        </Text>
      </Container>
    </ChakraProvider>
  );
}

export default App;
