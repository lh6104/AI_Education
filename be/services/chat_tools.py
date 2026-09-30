"""
Chat Tools - Centralized tool definitions for the chatbot
All tools for the AI model are defined here for better organization and maintainability.
Now integrated with Gemini File Search for native RAG capabilities.
"""

import logging
from typing import List, Dict, Any, Optional, Callable
from langchain_core.tools import StructuredTool
from models import Source

logger = logging.getLogger(__name__)
# Ensure this logger is at INFO level
logger.setLevel(logging.INFO)


class ChatTools:
    """Centralized class for all chatbot tools with Gemini File Search RAG"""
    
    def __init__(
        self,
        gemini_file_search: Optional[object] = None,  # GeminiFileSearchService instance
        student_context_func: Optional[Callable[[], Dict[str, Any]]] = None,
        google_search_api_key: str = None,
        google_search_engine_id: str = None,
    ):
        """
        Initialize ChatTools with Gemini File Search.
        
        Args:
            gemini_file_search: GeminiFileSearchService instance for native RAG
            student_context_func: Function to get student context (bound to user_id)
            google_search_api_key: Google Custom Search API key
            google_search_engine_id: Google Custom Search Engine ID
        """
        self.gemini_file_search = gemini_file_search
        self.student_context_func = student_context_func
        self.google_search_api_key = google_search_api_key
        self.google_search_engine_id = google_search_engine_id
        self.google_search_enabled = bool(google_search_api_key and google_search_engine_id)
        self.file_search_enabled = bool(gemini_file_search and gemini_file_search.is_available())
    
    # def create_file_search_tool(self) -> Optional[StructuredTool]:
    #     """Create Gemini File Search tool for native RAG."""
    #     if not self.file_search_enabled:
    #         logger.info("Gemini File Search not available; document search disabled")
    #         return None

    #     def _tool_callable(query: str) -> Dict[str, Any]:
    #         """Search uploaded files using Gemini File Search."""
    #         logger.debug(f"search_documents: Called with query: '{query}' (Gemini File Search)")
    #         if not query or not query.strip():
    #             logger.warning("search_documents: Empty query provided")
    #             return {"context": "", "sources": [], "found_documents": False}
            
    #         try:
    #             context_text, sources = self.gemini_file_search.search_files(query, max_results=5)
    #             num_sources = len(sources)
    #             context_length = len(context_text)
    #             logger.info(f"search_documents: Gemini File Search retrieved {num_sources} sources, context length: {context_length} chars")
    #             return {
    #                 "context": context_text,
    #                 "sources": [s.dict() for s in sources],
    #                 "found_documents": num_sources > 0,
    #                 "search_type": "gemini_file_search"
    #             }
    #         except Exception as e:
    #             logger.error(f"search_documents: Error with Gemini File Search: {str(e)}", exc_info=True)
    #             return {"context": "", "sources": [], "found_documents": False, "error": str(e)}

    #     return StructuredTool.from_function(
    #         name="search_documents",
    #         description=(
    #             "Search uploaded educational files and documents using Gemini's native file search. "
    #             "This searches through PDFs, documents, lesson materials, and other files uploaded to the system. "
    #             "Use this tool when: "
    #             "- User asks about concepts, definitions, or explanations from course materials "
    #             "- User asks about specific lessons, chapters, or uploaded content "
    #             "- User needs information from stored educational documents "
    #             "- User asks 'What does the material say about...?', 'Find information about...' "
    #             "DO NOT use this for: "
    #             "- Recent news or current events (use search_web instead) "
    #             "- Personal progress information (use get_my_context instead)"
    #         ),
    #         func=_tool_callable,
    #     )
    
    def create_file_context_tool(self) -> Optional[StructuredTool]:
        """Create conversation-based file search tool."""
        if not self.file_context_enabled:
            logger.info("FileContextService not available; document search disabled")
            return None

        def _tool_callable(query: str) -> Dict[str, Any]:
            """Search uploaded files in current conversation."""
            logger.debug(f"search_documents: Called with query: '{query}' (FileContextService)")
            
            if not query or not query.strip():
                logger.warning("search_documents: Empty query provided")
                return {"context": "", "sources": [], "found_documents": False}
            
            if not self.current_user_id or not self.current_conversation_id:
                logger.warning("search_documents: Missing user_id or conversation_id")
                return {"context": "", "sources": [], "found_documents": False, "error": "Missing context IDs"}
            
            try:
                context_text, sources = self.file_context_service.get_user_file_context(
                    self.current_user_id, 
                    self.current_conversation_id, 
                    query
                )
                
                num_sources = len(sources)
                context_length = len(context_text)
                logger.info(f"search_documents: FileContextService retrieved {num_sources} sources, context length: {context_length} chars")
                
                return {
                    "context": context_text,
                    "sources": [{
                        "title": s.get("title", ""),
                        "source": s.get("filename", ""),
                        "content_preview": f"File: {s.get('filename', '')}",
                        "similarity": 0.8
                    } for s in sources],
                    "found_documents": num_sources > 0,
                    "search_type": "file_context_service"
                }
            except Exception as e:
                logger.error(f"search_documents: Error with FileContextService: {str(e)}", exc_info=True)
                return {"context": "", "sources": [], "found_documents": False, "error": str(e)}

        return StructuredTool.from_function(
            name="search_documents",
            description=(
                "Search uploaded educational files and documents in the current conversation. "
                "This searches through PDFs, documents, lesson materials, and other files uploaded to this specific conversation. "
                "Use this tool when: "
                "- User asks about concepts, definitions, or explanations from uploaded materials "
                "- User asks about specific documents, files, or content they've shared "
                "- User needs information from stored educational documents in this chat "
                "- User asks 'What does the document say about...?', 'Find information in my files...' "
                "DO NOT use this for: "
                "- Recent news or current events (use search_web instead) "
                "- Personal progress information (use get_my_context instead)"
            ),
            func=_tool_callable,
        )
        
    
    
    def create_student_context_tool(self) -> Optional[StructuredTool]:
        """Create student context tool."""
        if not self.student_context_func:
            return None

        def _tool_callable() -> Dict[str, Any]:
            """Return student's learning context."""
            logger.debug("get_my_context: Called")
            try:
                context = self.student_context_func()
                quizzes_count = len(context.get("available_quizzes", []))
                progress_count = len(context.get("progress", []))
                logger.info(f"get_my_context: Retrieved context with {quizzes_count} quizzes, {progress_count} progress items")
                return context
            except Exception as e:
                logger.error(f"get_my_context: Error retrieving student context: {str(e)}", exc_info=True)
                return {"error": str(e), "available_quizzes": [], "progress": []}

        return StructuredTool.from_function(
            name="get_my_context",
            description=(
                "Fetch the current student's progress, quiz attempts, and available quizzes. "
                "Use this tool when: "
                "- User asks about their own learning status, scores, progress "
                "- User asks about completed lessons, quiz results, or streaks "
                "- User asks 'How am I doing?', 'What have I learned?', 'My progress' "
                "This tool automatically uses the authenticated user's information - do NOT ask for their ID."
            ),
            func=_tool_callable,
            args_schema=None,  # No parameters needed - user_id is bound
        )
    
    def create_google_search_tool(self) -> Optional[StructuredTool]:
        """Create Google web search tool."""
        if not self.google_search_enabled:
            logger.info("Google Search API not configured; web search disabled")
            return None

        try:
            from googleapiclient.discovery import build
            from googleapiclient.errors import HttpError
        except ImportError:
            logger.warning("google-api-python-client not installed; web search disabled")
            return None

        def _google_search(query: str, num_results: int = 5) -> Dict[str, Any]:
            """Search the web using Google Custom Search API."""
            logger.debug(f"search_web: Called with query: '{query}', num_results: {num_results}")
            try:
                # Build the service
                logger.debug("search_web: Building Google Custom Search service")
                service = build("customsearch", "v1", developerKey=self.google_search_api_key)
                
                # Perform the search
                request_num_results = min(num_results, 10)  # Google API max 10 results per request
                logger.info(f"search_web: Executing Google search (requesting {request_num_results} results)")
                result = service.cse().list(
                    q=query,
                    cx=self.google_search_engine_id,
                    num=request_num_results
                ).execute()
                
                # Extract search results
                items = result.get("items", [])
                total_results = result.get("searchInformation", {}).get("totalResults", "0")
                search_time = result.get("searchInformation", {}).get("searchTime", "0")
                logger.info(f"search_web: Google API returned {len(items)} items (total available: {total_results}, search time: {search_time}s)")
                
                search_results = []
                sources = []
                
                for idx, item in enumerate(items, 1):
                    title = item.get("title", "")
                    link = item.get("link", "")
                    snippet = item.get("snippet", "")
                    
                    search_results.append({
                        "title": title,
                        "url": link,
                        "snippet": snippet
                    })
                    
                    sources.append(
                        Source(
                            title=title,
                            source=link,
                            content_preview=snippet[:300] + ("..." if len(snippet) > 300 else ""),
                            similarity=1.0 - (idx * 0.1)  # Simple ranking score
                        )
                    )
                    logger.debug(f"search_web: Result {idx}: {title} -> {link}")
                
                # Format context text
                context_blocks = []
                for idx, result in enumerate(search_results, 1):
                    context_blocks.append(
                        f"[Result {idx} | {result['title']}]\n"
                        f"URL: {result['url']}\n"
                        f"Summary: {result['snippet']}"
                    )
                
                context_text = "\n\n".join(context_blocks)
                logger.info(f"search_web: Formatted {len(search_results)} results into context ({len(context_text)} chars)")
                
                return {
                    "context": context_text,
                    "sources": [s.dict() for s in sources],
                    "found_documents": len(search_results) > 0,
                    "total_results": total_results,
                    "search_time": search_time
                }
                
            except HttpError as e:
                error_msg = f"Google Search API error: {str(e)}"
                logger.error(f"search_web: {error_msg}", exc_info=True)
                return {
                    "context": "",
                    "sources": [],
                    "found_documents": False,
                    "error": error_msg
                }
            except Exception as e:
                error_msg = f"Error performing Google search: {str(e)}"
                logger.error(f"search_web: {error_msg}", exc_info=True)
                return {
                    "context": "",
                    "sources": [],
                    "found_documents": False,
                    "error": error_msg
                }

        return StructuredTool.from_function(
            name="search_web",
            description=(
                "Search the internet using Google for current information, news, real-time data, or information "
                "not available in the knowledge base. "
                "Use this tool when: "
                "- User asks about recent events, current news, or real-time information "
                "- User asks about latest updates, breaking news, or trending topics "
                "- User asks about information not likely in knowledge base "
                "- User asks 'What's new in...?', 'Latest news about...', 'Current status of...' "
            ),
            func=_google_search,
        )
    
    def get_all_tools(
        self,
        use_file_search: bool = True,
        use_student_context: bool = True,
        use_web_search: bool = True,
    ) -> List[StructuredTool]:
        """
        Get all available tools based on configuration.
        
        Args:
            use_file_search: Enable Gemini File Search tool
            use_student_context: Enable student context tool
            use_web_search: Enable web search tool
        
        Returns:
            List of StructuredTool objects
        """
        tools = []
        
        if use_file_search and self.file_context_enabled:
            file_search_tool = self.create_file_context_tool()
            if file_search_tool:
                tools.append(file_search_tool)
                logger.debug("Added FileContextService search tool")
        
        if use_student_context:
            context_tool = self.create_student_context_tool()
            if context_tool:
                tools.append(context_tool)
                logger.debug("Added student context tool")
        
        if use_web_search and self.google_search_enabled:
            web_tool = self.create_google_search_tool()
            if web_tool:
                tools.append(web_tool)
                logger.debug("Added Google web search tool")
        
        return tools
    
    def get_tool_descriptions(self, tools: List[StructuredTool]) -> List[str]:
        """Get formatted descriptions for tools to add to system prompt."""
        descriptions = []
        
        for tool in tools:
            tool_name = tool.name
            tool_desc = tool.description
            
            # Format description
            if tool_name == "search_documents":
                descriptions.append(
                    "- search_documents(query: str): Search the knowledge base for relevant educational content, "
                    "lessons, or documents. Use when the user asks questions that might be answered by stored materials."
                )
            elif tool_name == "get_my_context":
                descriptions.append(
                    "- get_my_context(): Returns the current student's progress, quizzes, and streaks. "
                    "Call when the user asks about their own status, performance, or learning history."
                )
            elif tool_name == "search_web":
                descriptions.append(
                    "- search_web(query: str, num_results=5): Search the internet using Google for current information, "
                    "recent news, or real-time data. Use when the user asks about topics that require up-to-date information."
                )
        
        return descriptions

