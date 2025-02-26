from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
import time
import json
from crewai import Agent, Task, Crew, Process
import arxiv
from typing import List, Dict
from datetime import datetime
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store ongoing research processes and results
research_processes = {}
research_results = {}
research_logs = {}

class EnhancedSearchTool:
    """Search tool with multiple backends and caching"""
    
    def __init__(self, api_keys: Dict[str, str]):
        self.api_keys = api_keys
        self.cache = {}
        self.name = "enhanced_literature_search"
        self.description = "Search scientific literature across multiple sources"
        self.last_query_time = 0
        self.query_count = 0
        self.max_queries_per_session = 20
    
    def func(self, query: str) -> Dict:
        """Search with caching and rate limiting"""
        # Log the search query
        logger.info(f"Searching for: {query}")
        
        # Add to logs
        session_id = getattr(self, 'session_id', 'default')
        if session_id in research_logs:
            research_logs[session_id].append({
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "agent": "Search Tool",
                "action": "Searching",
                "result": f"Query: {query}"
            })
        
        # Check cache
        cache_key = query.lower().strip()
        if cache_key in self.cache:
            logger.info(f"Cache hit for: {query}")
            return self.cache[cache_key]
        
        # Rate limiting
        current_time = time.time()
        if hasattr(self, 'last_query_time') and current_time - self.last_query_time < 2:
            time.sleep(2 - (current_time - self.last_query_time))
        
        # Check query limits
        self.query_count = getattr(self, 'query_count', 0) + 1
        if self.query_count > self.max_queries_per_session:
            logger.warning("Maximum query limit reached")
            return {"error": "Query limit reached", "results": {"arxiv": [], "web": []}}
        
        results = {
            "arxiv": [],
            "web": []
        }
        
        # Always try arXiv first - it's free and doesn't need an API key
        try:
            # arXiv search
            search = arxiv.Search(
                query=query,
                max_results=5,
                sort_by=arxiv.SortCriterion.Relevance
            )
            results["arxiv"] = [
                {
                    "title": result.title,
                    "authors": [str(author) for author in result.authors],
                    "summary": result.summary,
                    "pdf_url": result.pdf_url,
                    "published": result.published.strftime("%Y-%m-%d") if hasattr(result, "published") else None
                }
                for result in search.results()
            ]
        except Exception as e:
            logger.error(f"Error in arXiv search: {str(e)}")
        
        # Only use SerpAPI if we don't have enough results from arXiv
        if len(results["arxiv"]) < 3 and "serpapi" in self.api_keys and self.api_keys["serpapi"]:
            try:
                from serpapi import GoogleSearch
                
                # Web search using SerpAPI
                web_search = GoogleSearch({
                    "q": query,
                    "api_key": self.api_keys["serpapi"],
                    "num": 3  # Reduce the number to save API calls
                })
                results["web"] = web_search.get_dict().get("organic_results", [])
            except Exception as e:
                logger.error(f"Error in web search: {str(e)}")
        
        # Cache results
        self.cache[cache_key] = results
        self.last_query_time = time.time()
        
        return results

class EnhancedAICoScientist:
    def __init__(self, session_id: str, openai_api_key: str, serpapi_key: str = None):
        """Initialize the Enhanced AI Co-Scientist system with API keys."""
        self.session_id = session_id
        os.environ['OPENAI_API_KEY'] = openai_api_key
        
        api_keys = {}
        if serpapi_key:
            api_keys["serpapi"] = serpapi_key
        
        self.search_tool = EnhancedSearchTool(api_keys)
        self.search_tool.session_id = session_id
        
        # Initialize logs for this session
        research_logs[session_id] = []
    
    def log_activity(self, agent_name: str, action: str, result: str):
        """Log agent activities for monitoring."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "agent": agent_name,
            "action": action,
            "result": result
        }
        
        # Add to session logs
        if self.session_id in research_logs:
            research_logs[self.session_id].append(log_entry)
        
        logger.info(f"{timestamp} - {agent_name}: {action} - {result}")

    def create_specialized_agents(self) -> Dict[str, Agent]:
        """Create enhanced specialized agents with additional tools."""
        agents = {}
        
        # Generation Agent
        agents["generation"] = Agent(
            name="Generation Agent",
            role="Research Generation Specialist",
            goal="Generate novel research directions and hypotheses",
            backstory="""Advanced AI specialized in generating innovative research directions.
            Use the scientific literature search tool to gather information and generate novel hypotheses.""",
            tools=[self.search_tool],
            verbose=True,
            allow_delegation=True
        )
        
        # Reflection Agent
        agents["reflection"] = Agent(
            name="Reflection Agent",
            role="Research Reflection Specialist",
            goal="Analyze and reflect on research approaches",
            backstory="""Expert in critical analysis of research methodologies.
            Use the scientific literature search tool to validate and expand upon findings.""",
            tools=[self.search_tool],
            verbose=True,
            allow_delegation=True
        )
        
        return agents

    def create_supervisor_agent(self) -> Agent:
        """Create the supervisor agent that coordinates other agents."""
        return Agent(
            name="Supervisor Agent",
            role="Research Coordination Manager",
            goal="Coordinate and manage research agents effectively",
            backstory="""Senior research coordinator responsible for managing specialized research agents.
            Ensures all research directions are properly explored and validated.""",
            verbose=True,
            allow_delegation=True
        )

    def create_research_tasks(self, research_goal: str, agents: Dict[str, Agent]) -> List[Task]:
        """Create research tasks based on the provided goal."""
        tasks = []
        
        # Generation Task
        tasks.append(Task(
            description=f"""Generate novel research directions for: {research_goal}

Steps:
1. Use the enhanced_literature_search tool to gather relevant research papers
2. Analyze current state of research in this area
3. Identify gaps and opportunities
4. Generate novel hypotheses and research directions
5. Provide reasoning for each suggested direction""",
            expected_output="""- A list of research directions with justification,
- Supporting literature for each direction,
- Potential impact and feasibility assessment""",
            agent=agents["generation"]
        ))
        
        # Reflection Task
        tasks.append(Task(
            description=f"""Analyze and reflect on the generated research directions

Steps:
1. Review the generated research directions
2. Use enhanced_literature_search to validate assumptions
3. Identify potential challenges and limitations
4. Suggest refinements and improvements
5. Prioritize the most promising directions""",
            expected_output="""- Critical analysis of each research direction,
- Suggested improvements and refinements,
- Final prioritized list with recommendations""",
            agent=agents["reflection"]
        ))
        
        return tasks

    def run_research_process(self, research_goal: str) -> Dict:
        """Execute the enhanced research process with logging."""
        agents = self.create_specialized_agents()
        supervisor = self.create_supervisor_agent()
        tasks = self.create_research_tasks(research_goal, agents)
        
        crew = Crew(
            agents=[supervisor] + list(agents.values()),
            tasks=tasks,
            process=Process.sequential,
            verbose=True
        )
        
        self.log_activity("Supervisor", "Process Started", f"Goal: {research_goal}")
        
        try:
            result = crew.kickoff()
            self.log_activity("Supervisor", "Process Completed", "Research results generated")
            return result
        except Exception as e:
            error_msg = f"Error in research process: {str(e)}"
            self.log_activity("Supervisor", "Process Error", error_msg)
            raise Exception(error_msg)

def research_worker(session_id, research_goal, openai_api_key, serpapi_key):
    """Worker function to run research in a separate thread"""
    try:
        # Set process as running
        research_processes[session_id] = "running"
        
        # Initialize the scientist
        scientist = EnhancedAICoScientist(session_id, openai_api_key, serpapi_key)
        
        # Run the research process
        result = scientist.run_research_process(research_goal)
        
        # Store result
        research_results[session_id] = result
        research_processes[session_id] = "completed"
        
    except Exception as e:
        error_msg = f"Error in research process: {str(e)}"
        logger.error(error_msg)
        research_results[session_id] = {"error": error_msg}
        research_processes[session_id] = "error"

@app.route('/api/start_research', methods=['POST'])
def start_research():
    """Start a new research process"""
    data = request.json
    
    # Validate inputs
    if not data.get('research_goal'):
        return jsonify({"status": "error", "message": "Research goal is required"}), 400
    
    if not data.get('openai_api_key'):
        return jsonify({"status": "error", "message": "OpenAI API key is required"}), 400
    
    # Generate a session ID
    session_id = f"research_{int(time.time())}"
    
    # Initialize logs
    research_logs[session_id] = []
    
    # Start research in a separate thread
    thread = threading.Thread(
        target=research_worker,
        args=(
            session_id,
            data.get('research_goal'),
            data.get('openai_api_key'),
            data.get('serpapi_key')
        )
    )
    thread.start()
    
    return jsonify({
        "status": "success",
        "session_id": session_id,
        "message": "Research process started"
    })

@app.route('/api/research_status/<session_id>', methods=['GET'])
def research_status(session_id):
    """Get status of a research process"""
    if session_id not in research_processes:
        return jsonify({"status": "error", "message": "Session not found"}), 404
    
    # Get logs for this session
    logs = research_logs.get(session_id, [])
    
    # Get process status
    process_status = research_processes.get(session_id, "unknown")
    
    # Get results if available
    result = None
    if process_status == "completed":
        result = research_results.get(session_id)
    
    return jsonify({
        "status": "success",
        "process_status": process_status,
        "logs": logs,
        "result": result
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({"status": "healthy"})

# Entry point for serverless functions
def handler(request):
    return app(request)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
