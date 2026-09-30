import os
import time
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import Depends, HTTPException
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage, ToolMessage
from models import ChatResponse, Source
from repositories.user_repository import UserRepository
from repositories.chat_repository import ChatRepository
from services.student_context_service import StudentContextService
from services.file_context_service import FileContextService
from services.chat_tools import ChatTools
from dependencies.gemini_file_search import get_gemini_file_search

# Configure logging
logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat operations with the configured Groq model."""

    def __init__(
        self,
        user_repository: UserRepository = Depends(),
        chat_repository: ChatRepository = Depends(),
        student_context_service: StudentContextService = Depends(),
    ):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.user_repo = user_repository
        self.chat_repo = chat_repository
        self.student_ctx = student_context_service
        
        # Get shared Gemini File Search service instance
        self.gemini_search = get_gemini_file_search()
        
        # Initialize file context service with shared Gemini instance
        self.file_ctx = FileContextService(gemini_search=self.gemini_search)
        
        # Environment-driven configuration
        model_name_env = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        temperature_env = os.getenv("TEMPERATURE")
        max_tokens_env = os.getenv("MAX_TOKENS")
        history_limit_env = os.getenv("CHAT_HISTORY_LIMIT")

        self.model_name = model_name_env
        self.temperature = self._parse_float_env("TEMPERATURE", 0.7)
        self.max_tokens = self._parse_int_env("MAX_TOKENS", 2048)
        self.history_limit = self._parse_int_env("CHAT_HISTORY_LIMIT", 10)

        self.llm: Optional[ChatGroq] = None
        self._initialize_langchain_components()
        
        # Initialize chat tools (disable file search tool since we use FileContextService)
        self.chat_tools = ChatTools(
            gemini_file_search=None,  # Disable file search tool
            student_context_func=None,  # Will be set per request with user_id
            google_search_api_key=os.getenv("GOOGLE_SEARCH_API_KEY"),
            google_search_engine_id=os.getenv("GOOGLE_SEARCH_ENGINE_ID"),
        )

    @staticmethod
    def _parse_float_env(name: str, default: float) -> float:
        """Parse float from environment variable with fallback"""
        try:
            return float(os.getenv(name, str(default)))
        except Exception:
            logger.warning(f"Invalid {name} – falling back to {default}")
            return default
    
    @staticmethod
    def _parse_int_env(name: str, default: int) -> int:
        """Parse int from environment variable with fallback"""
        try:
            return int(os.getenv(name, str(default)))
        except Exception:
            logger.warning(f"Invalid {name} – falling back to {default}")
            return default

    def _initialize_langchain_components(self) -> None:
        """Initialize the Groq-backed LangChain chat model."""
        if not self.api_key:
            logger.warning("GROQ_API_KEY not configured; chat model unavailable")
        else:
            try:
                self.llm = ChatGroq(
                    model=self.model_name,
                    api_key=self.api_key,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )
                logger.info("Chat model initialized successfully")
            except Exception as exc:
                logger.error(f"Failed to initialize Groq chat model: {exc}")

    @staticmethod
    def _convert_history_to_messages(history: List[Dict[str, Any]]) -> List[BaseMessage]:
        messages: List[BaseMessage] = []
        for item in history:
            content = item.get("content", "")
            if not content:
                continue

            role = item.get("role", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
            elif role == "system":
                messages.append(SystemMessage(content=content))

        return messages

    @staticmethod
    def _extract_response_content(response: BaseMessage) -> str:
        if isinstance(response, AIMessage):
            if isinstance(response.content, str):
                return response.content
            if isinstance(response.content, list):
                parts: List[str] = []
                for part in response.content:
                    if isinstance(part, dict):
                        text = part.get("text") or part.get("content")
                        if text:
                            parts.append(str(text))
                    else:
                        parts.append(str(part))
                if parts:
                    return "".join(parts)

        return str(response)

    def get_model(self):
        """Get the configured Groq model instance."""
        if not self.llm:
            logger.error("Chat model is not initialized")
            raise HTTPException(status_code=500, detail="Chat model not configured")

        return self.llm

    def create_conversation(self, user_id: int, title: str = "New Conversation") -> Dict[str, Any]:
        """Create a new conversation"""
        conversation = self.chat_repo.create_conversation(user_id, title)
        return {
            "id": conversation.id,
            "user_id": conversation.user_id,
            "title": conversation.title,
            "messages": [],
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        }

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID with messages"""
        conversation = self.chat_repo.get_conversation(conversation_id)
        if not conversation:
            return None

        # Convert messages to dict format
        messages = [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat()
            }
            for msg in conversation.messages
        ]

        return {
            "id": conversation.id,
            "user_id": conversation.user_id,
            "title": conversation.title,
            "messages": messages,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at
        }

    def get_user_conversations(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        conversations = self.chat_repo.get_user_conversations(user_id)

        return [
            {
                "id": conv.id,
                "user_id": conv.user_id,
                "title": conv.title,
                "message_count": len(conv.messages),
                "last_message": conv.messages[-1].content[:50] + "..." if conv.messages else "",
                "created_at": conv.created_at,
                "updated_at": conv.updated_at
            }
            for conv in conversations
        ]

    def add_message_to_conversation(
        self, 
        conversation_id: str,
        user_id: int,
        message: str,
        role: str = "user"
    ) -> Dict[str, Any]:
        """Add a message to a conversation"""
        # Verify user owns this conversation
        if not self.chat_repo.verify_user_owns_conversation(conversation_id, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to access this conversation")

        # Add message to database
        message_obj = self.chat_repo.add_message(conversation_id, role, message)

        # Get conversation for title update logic
        conversation = self.get_conversation(conversation_id)

        # Update conversation title if this is the first user message
        user_messages = [m for m in conversation["messages"] if m["role"] == "user"]
        if len(user_messages) == 1 and role == "user":
            title = f"{message[:30]}..." if len(message) > 30 else message
            self.chat_repo.update_conversation_title(conversation_id, title)

        return {
            "id": message_obj.id,
            "role": message_obj.role,
            "content": message_obj.content,
            "timestamp": message_obj.created_at.isoformat()
        }

    def delete_conversation(self, conversation_id: str, user_id: int) -> bool:
        """Delete a conversation and its associated files"""
        # Verify user owns this conversation
        if not self.chat_repo.verify_user_owns_conversation(conversation_id, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")

        try:
            # Delete conversation files from Gemini File Search Store
            if self.gemini_search:
                try:
                    self.gemini_search.delete_conversation_store(conversation_id)
                    logger.info(f"Deleted File Search Store for conversation {conversation_id}")
                except Exception as e:
                    logger.warning(f"Failed to delete File Search Store for {conversation_id}: {e}")
            
            # Delete conversation from database
            result = self.chat_repo.delete_conversation(conversation_id)
            
            if result:
                logger.info(f"Conversation {conversation_id} deleted successfully")
            
            return result
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id}: {e}")
            return False

    def update_conversation_title(self, conversation_id: str, user_id: int, title: str) -> bool:
        """Update conversation title"""
        # Verify user owns this conversation
        if not self.chat_repo.verify_user_owns_conversation(conversation_id, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to update this conversation")

        conversation = self.chat_repo.update_conversation_title(conversation_id, title)
        return conversation is not None

    def _load_base_system_text(self) -> str:
        """Load base system prompt as text from system_prompt.json (supports plain text or {"base": str})."""
        try:
            with open("system_prompt.json", "r", encoding="utf-8") as f:
                raw = f.read().strip()
                # If file is JSON with a "base" string, use it; otherwise treat as plain text
                try:
                    data = json.loads(raw)
                    if isinstance(data, dict) and isinstance(data.get("base"), str):
                        return data["base"].strip()
                    # Fallback: stringify non-string JSON
                    return json.dumps(data, ensure_ascii=False)
                except json.JSONDecodeError:
                    return raw
        except FileNotFoundError:
            logger.error("system_prompt.json not found")
            raise HTTPException(status_code=500, detail="system_prompt.json not found")

    def format_system_prompt(self, rag_context: str = "", student_json: str = "") -> str:
        """Compose a single system instruction string. Do NOT return JSON.

        We embed private context in a delimited block and instruct the model not to reveal it.
        """
        base_text = self._load_base_system_text()

        # Enforce a consistent follow-up section based on system_prompt.json semantics
        # We don't assume the JSON file contains executable rules; ensure the model outputs
        # a markdown section exactly titled "Follow_Up_Questions" with 3-5 bullet items.
        followup_rule = (
            "Cuối mỗi câu trả lời, bắt buộc thêm mục heading markdown '## Follow_Up_Questions' "
            "chứa 3-5 gợi ý hỏi tiếp theo dạng danh sách gạch đầu dòng (- ...). "
            "Không lặp lại nội dung trả lời ở phần này."
        )

        private_blocks = []
        if rag_context:
            private_blocks.append(f"[RAG]\n{rag_context}")
        if student_json:
            private_blocks.append(f"[STUDENT]\n{student_json}")
        private_context = "\n\n".join(private_blocks)

        if private_context:
            rules = (
                "Quy tắc: Sử dụng PRIVATE_CONTEXT chỉ để lập luận. Tuyệt đối KHÔNG hiển thị lại, trích dẫn "
                "hay sao chép nguyên văn PRIVATE_CONTEXT (đặc biệt là JSON) trong câu trả lời. Tùy biến câu trả lời "
                "dựa trên ngữ cảnh một cách tự nhiên."
            )
            return (
                f"{base_text}\n\n{rules}\n\n{followup_rule}\n\n"
                f"<PRIVATE_CONTEXT>\n{private_context}\n</PRIVATE_CONTEXT>"
            )
        return f"{base_text}\n\n{followup_rule}"

    def generate_chat_response(
        self, 
        message: str, 
        conversation_id: Optional[str],
        user_id: int,
        use_rag: bool = True,
        use_student_context: bool = True,
    ) -> Dict[str, Any]:
        """Generate a response from the AI model"""
        start_time = time.time()

        try:
            # Get or create conversation
            conversation = None
            if conversation_id:
                conversation = self.get_conversation(conversation_id)
                if conversation and conversation.get("user_id") != user_id:
                    raise HTTPException(status_code=403, detail="Not authorized to access this conversation")

            if not conversation:
                title = f"{message[:30]}..." if len(message) > 30 else message
                conversation = self.create_conversation(user_id, title)
                conversation_id = conversation["id"]

            # Add user message to conversation
            self.add_message_to_conversation(conversation_id, user_id, message, "user")
            conversation = self.get_conversation(conversation_id)
            if not conversation:
                raise HTTPException(status_code=500, detail="Conversation state unavailable")

            history_messages = conversation["messages"][:-1]
            if self.history_limit and len(history_messages) > self.history_limit:
                history_messages = history_messages[-self.history_limit:]

            # Configure chat tools for this request
            self.chat_tools.student_context_func = lambda: self.student_ctx.build_context(user_id)
            
            # Get file context if user has files and RAG is enabled
            file_context = ""
            file_sources = []
            if use_rag and self.file_ctx.has_user_files(user_id, conversation_id):
                logger.info(f"Processing file context for conversation {conversation_id} with query: {message}")
                try:
                    file_context, file_sources = self.file_ctx.get_file_context(user_id, conversation_id, message)
                    if file_context:
                        logger.info(f"📄 File context generated: {len(file_context)} chars from {len(file_sources)} sources")
                    else:
                        logger.info("ℹ️ No relevant file context found")
                except Exception as file_ctx_error:
                    logger.error(f"❌ Error getting file context: {file_ctx_error}")
                    # Continue without file context rather than failing entirely
                    file_context = ""
                    file_sources = []
            elif use_rag:
                logger.info(f"No files found for conversation {conversation_id}")
            
            # Build tools list (file search handled by FileContextService)
            tools = self.chat_tools.get_all_tools(
                use_file_search=False,  # Disabled - handled by FileContextService
                use_student_context=use_student_context,
                use_web_search=True,  # Keep web search if configured
            )
            
            tool_names = [tool.name for tool in tools]
            file_context_status = "enabled" if file_context else "no files or no context"
            logger.info(f"🔧 Configured tools for user {user_id}: {tool_names} (file_context: {file_context_status}, Student Context: {use_student_context}, Web Search: {self.chat_tools.google_search_enabled})")
            
            tool_descriptions = self.chat_tools.get_tool_descriptions(tools)

            # Create system prompt with file context
            system_prompt = self.format_system_prompt(file_context, "")
            if tool_descriptions:
                system_prompt = f"{system_prompt}\n\nTools available:\n" + "\n".join(tool_descriptions)
                logger.debug(f"System prompt includes {len(tool_descriptions)} tool description(s)")

            model = self.get_model()
            lc_history = self._convert_history_to_messages(history_messages)

            if tools:
                logger.debug(f"Binding {len(tools)} tool(s) to model: {tool_names}")
                # Bind tools to the model for native tool calling
                model_with_tools = model.bind_tools(tools)
                
                # Prepare messages with history
                lc_messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
                lc_messages.extend(lc_history)
                lc_messages.append(HumanMessage(content=message))
                
                # Invoke model with tools
                response_message = model_with_tools.invoke(lc_messages)
                
                # Check if model wants to call tools
                tool_calls = getattr(response_message, "tool_calls", []) or []
                sources: List[Source] = []  # Track sources from RAG tool
                
                if tool_calls:
                    logger.info(f"Model requested {len(tool_calls)} tool call(s)")
                    # Execute tool calls
                    lc_messages.append(response_message)  # Add the response with tool calls first
                    
                    for idx, tool_call in enumerate(tool_calls, 1):
                        logger.debug(f"Processing tool call {idx}/{len(tool_calls)}")
                        # Handle different tool call formats
                        if isinstance(tool_call, dict):
                            tool_name = tool_call.get("name", "")
                            tool_args = tool_call.get("args", {})
                            tool_call_id = tool_call.get("id", str(hash(str(tool_call))))
                        else:
                            # If tool_call is an object, try to get attributes
                            tool_name = getattr(tool_call, "name", "")
                            tool_args = getattr(tool_call, "args", {})
                            tool_call_id = getattr(tool_call, "id", str(id(tool_call)))
                        
                        # Find the tool
                        tool = next((t for t in tools if t.name == tool_name), None)
                        if not tool:
                            logger.warning(f"Tool '{tool_name}' not found in available tools: {tool_names}")
                            continue
                        
                        try:
                            # Log tool invocation start
                            logger.info(f"Tool invoked: {tool_name} | Call ID: {tool_call_id}")
                            if tool_args:
                                # Log arguments (sanitize sensitive data if needed)
                                args_str = json.dumps(tool_args, ensure_ascii=False) if isinstance(tool_args, dict) else str(tool_args)
                                logger.debug(f"   Arguments: {args_str}")
                            
                            # Prepare tool arguments based on tool type
                            if tool_name == "search_documents":
                                # Extract query string from args
                                if isinstance(tool_args, dict):
                                    query = tool_args.get("query", "")
                                elif isinstance(tool_args, str):
                                    query = tool_args
                                else:
                                    query = str(tool_args) if tool_args else ""
                                logger.info(f"   Searching documents with query: '{query[:100]}...' (truncated)" if len(query) > 100 else f"   Searching documents with query: '{query}'")
                                tool_result = tool.invoke({"query": query})
                                
                            elif tool_name == "search_web":
                                # Extract query and num_results from args
                                if isinstance(tool_args, dict):
                                    query = tool_args.get("query", "")
                                    num_results = tool_args.get("num_results", 5)
                                elif isinstance(tool_args, str):
                                    query = tool_args
                                    num_results = 5
                                else:
                                    query = str(tool_args) if tool_args else ""
                                    num_results = 5
                                logger.info(f"   Searching web with query: '{query[:100]}...' (truncated), num_results: {num_results}" if len(query) > 100 else f"   Searching web with query: '{query}', num_results: {num_results}")
                                tool_result = tool.invoke({"query": query, "num_results": num_results})
                                
                            elif tool_name == "get_my_context":
                                # No parameters needed
                                logger.info(f"   Fetching student context for user_id: {user_id}")
                                tool_result = tool.invoke({})
                            else:
                                # Generic tool invocation
                                logger.debug(f"   Generic tool invocation with args: {tool_args}")
                                tool_result = tool.invoke(tool_args if isinstance(tool_args, dict) else {})
                            
                            # Extract sources if this is a search tool
                            if tool_name in ["search_documents", "search_web"] and isinstance(tool_result, dict):
                                sources_data = tool_result.get("sources", [])
                                num_sources = len(sources_data)
                                found_docs = tool_result.get("found_documents", False)
                                # Accumulate sources from all search tool calls
                                new_sources = [Source(**s) for s in sources_data if isinstance(s, dict)]
                                sources.extend(new_sources)
                                logger.info(f"   Tool '{tool_name}' completed: Found {num_sources} sources, found_documents: {found_docs}")
                                # Include context in tool message for model to use
                                tool_content = json.dumps(tool_result, ensure_ascii=False)
                            elif tool_name == "get_my_context" and isinstance(tool_result, dict):
                                # Log student context retrieval
                                quizzes_count = len(tool_result.get("available_quizzes", []))
                                progress_count = len(tool_result.get("progress", []))
                                logger.info(f"   Tool '{tool_name}' completed: Retrieved {quizzes_count} quizzes, {progress_count} progress items")
                                tool_content = tool_result if isinstance(tool_result, str) else json.dumps(tool_result, ensure_ascii=False)
                            else:
                                # For other tools, format normally
                                result_preview = str(tool_result)[:200] + "..." if len(str(tool_result)) > 200 else str(tool_result)
                                logger.info(f"   Tool '{tool_name}' completed: Result preview: {result_preview}")
                                tool_content = tool_result if isinstance(tool_result, str) else json.dumps(tool_result, ensure_ascii=False)
                            
                            lc_messages.append(
                                ToolMessage(
                                    content=tool_content,
                                    tool_call_id=tool_call_id,
                                )
                            )
                        except Exception as tool_exc:
                            logger.error(f"   Tool execution failed for '{tool_name}' (Call ID: {tool_call_id}): {str(tool_exc)}", exc_info=True)
                            lc_messages.append(
                                ToolMessage(
                                    content=f"Error executing tool: {str(tool_exc)}",
                                    tool_call_id=tool_call_id,
                                )
                            )
                    
                    # Get final response after tool execution
                    logger.info(f"Invoking model for final response after {len(tool_calls)} tool call(s)")
                    final_response = model_with_tools.invoke(lc_messages)
                    response_text = self._extract_response_content(final_response).strip()
                    logger.debug(f"Final response length: {len(response_text)} chars")
                else:
                    logger.debug("No tool calls requested by model - using direct response")
                    response_text = self._extract_response_content(response_message).strip()
            else:
                lc_messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]
                lc_messages.extend(lc_history)
                lc_messages.append(HumanMessage(content=message))

                response_message = model.invoke(lc_messages)
                response_text = self._extract_response_content(response_message).strip()

            if not response_text:
                logger.error(f"❌ Model returned empty response for user {user_id}, conversation {conversation_id}")
                logger.debug(f"Raw response object: {type(response_message)}")
                
                # Provide a helpful fallback message
                if file_context:
                    response_text = "Tôi đã tìm thấy thông tin trong tài liệu của bạn, nhưng gặp khó khăn trong việc xử lý. Vui lòng thử đặt câu hỏi cụ thể hơn hoặc sử dụng từ khóa khác."
                    logger.info(f"🔄 Using fallback response with file context for user {user_id}")
                else:
                    response_text = "Xin lỗi, tôi gặp khó khăn trong việc xử lý câu hỏi này. Vui lòng thử lại hoặc diễn đạt câu hỏi theo cách khác."
                    logger.info(f"🔄 Using fallback response without context for user {user_id}")
                
                # Don't raise exception, use fallback response instead

            self.add_message_to_conversation(conversation_id, user_id, response_text, "assistant")

            processing_time = time.time() - start_time
            logger.info(f"✅ Generated response for user {user_id} in {processing_time:.2f}s")

            # Combine sources from tools and file context
            all_sources = sources.copy()  # Tool-based sources
            if file_sources:
                # File sources are already Source objects from GeminiFileSearchService
                all_sources.extend(file_sources)
                logger.debug(f"📎 Added {len(file_sources)} file sources to response")

            return ChatResponse(
                response=response_text,
                conversation_id=conversation_id,
                sources=all_sources,
                timestamp=datetime.now(),
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Error generating response for user {user_id}: {exc}")
            raise HTTPException(status_code=500, detail=f"Error generating response: {exc}")

    def get_conversation_file_stats(self, conversation_id: str, user_id: int) -> Dict[str, Any]:
        """Get file statistics for a conversation"""
        try:
            # Verify user owns this conversation
            if not self.chat_repo.verify_user_owns_conversation(conversation_id, user_id):
                raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
            
            # Get local files
            local_files = self.file_ctx.file_repo.get_files_by_conversation(conversation_id)
            
            # Get Gemini store info
            gemini_status = {}
            if self.gemini_search:
                try:
                    stores = self.gemini_search.list_conversation_stores()
                    store_info = next((s for s in stores if s['conversation_id'] == conversation_id), None)
                    files_count = self.gemini_search.get_conversation_files_count(conversation_id)
                    
                    gemini_status = {
                        'store_exists': store_info is not None,
                        'store_info': store_info,
                        'files_count': files_count
                    }
                except Exception as e:
                    logger.error(f"❌ Error getting Gemini store info: {e}")
                    gemini_status = {'error': str(e)}
            
            return {
                'conversation_id': conversation_id,
                'local_files_count': len(local_files),
                'local_files': local_files,
                'gemini_store': gemini_status,
                'has_files': len(local_files) > 0
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error getting conversation file stats: {e}")
            return {
                'conversation_id': conversation_id,
                'error': str(e)
            }

    def clear_conversation_files(self, conversation_id: str, user_id: int) -> Dict[str, Any]:
        """Clear all files for a conversation"""
        try:
            # Verify user owns this conversation
            if not self.chat_repo.verify_user_owns_conversation(conversation_id, user_id):
                raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
            
            # Delete from Gemini File Search Store
            gemini_deleted = False
            if self.gemini_search:
                try:
                    gemini_deleted = self.gemini_search.delete_conversation_store(conversation_id)
                    logger.info(f"🗑️ Gemini store deletion for {conversation_id}: {gemini_deleted}")
                except Exception as e:
                    logger.error(f"❌ Failed to delete Gemini store: {e}")
            
            # Clear local files
            local_deleted = self.file_ctx.file_repo.clear_conversation_files(conversation_id)
            
            logger.info(f"🧹 Cleared conversation {conversation_id}: {local_deleted} local files, Gemini store: {gemini_deleted}")
            
            return {
                'conversation_id': conversation_id,
                'local_files_deleted': local_deleted,
                'gemini_store_deleted': gemini_deleted,
                'success': True
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error clearing conversation files: {e}")
            return {
                'conversation_id': conversation_id,
                'error': str(e),
                'success': False
            }
