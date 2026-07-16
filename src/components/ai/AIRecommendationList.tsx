import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  CornerDownRight, 
  AlertTriangle, 
  Compass, 
  Globe, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Paperclip,
  Check,
  Cpu,
  Bot,
  User,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import type { TelemetryState } from '../../types/telemetry';
import { triggerAction } from '../../utils/telemetryEngine';

interface AIRecommendationListProps {
  currentPage: string;
  telemetryState: TelemetryState;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  confidence?: { score: number; reasoning: string };
  explainability?: { primaryFactors: string[]; reasoningChain: string };
  recommendedActions?: Array<{
    actionType: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    rationale: string;
    payload: Record<string, any>;
  }>;
  navigationSteps?: Array<{
    instruction: string;
    zone: string;
    distanceEstimate?: string;
    accessibilityFriendly: boolean;
  }>;
  emergencyAlert?: {
    active: boolean;
    urgency: 'NONE' | 'ADVISORY' | 'WARNING' | 'EVACUATE';
    instructions?: string;
  };
  language?: string;
  translationCompletion?: string;
}

interface ChatThread {
  id: string;
  title: string;
  role: 'FAN' | 'OPS' | 'SECURITY' | 'VOLUNTEER' | 'ACCESSIBILITY' | 'TRANSIT';
  messages: ChatMessage[];
}

export default function AIRecommendationList({ currentPage, telemetryState: _telemetryState }: AIRecommendationListProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'stadium-4o' | 'stadium-o1'>('stadium-4o');
  const [_errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Threads state
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('');
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map active page to AI role
  const getRoleForPage = (page: string): 'FAN' | 'OPS' | 'SECURITY' | 'VOLUNTEER' | 'ACCESSIBILITY' | 'TRANSIT' => {
    switch (page) {
      case 'fan': return 'FAN';
      case 'ops': return 'OPS';
      case 'security': return 'SECURITY';
      case 'volunteer': return 'VOLUNTEER';
      case 'accessibility': return 'ACCESSIBILITY';
      case 'analytics': return 'TRANSIT';
      case 'incidents': return 'SECURITY';
      case 'settings': return 'OPS';
      default: return 'OPS';
    }
  };

  const currentRole = getRoleForPage(currentPage);

  // Initialize first thread on mount
  useEffect(() => {
    const initialThreadId = `thread-${Date.now()}`;
    const initialThread: ChatThread = {
      id: initialThreadId,
      title: `${currentRole} Console Chat`,
      role: currentRole,
      messages: [
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Welcome back, **StadiumOS Advisor** is online.\nYour workspace is dynamically adjusted to **${currentRole}** console privileges.\nHow can I help you support operations?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setThreads([initialThread]);
    setActiveThreadId(initialThreadId);
  }, []);

  // Switch role or append thread if page changes
  useEffect(() => {
    if (threads.length > 0) {
      // Find if we already have a thread for this role
      const existingThread = threads.find(t => t.role === currentRole);
      if (existingThread) {
        setActiveThreadId(existingThread.id);
      } else {
        // Create new thread for new console role
        const newId = `thread-${Date.now()}`;
        const newThread: ChatThread = {
          id: newId,
          title: `${currentRole} Console Chat`,
          role: currentRole,
          messages: [
            {
              id: 'welcome',
              sender: 'assistant',
              text: `Switched workspace. **StadiumOS Advisor** matches **${currentRole}** console parameters.\nAsk me questions or select suggested commands below.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
        setThreads(prev => [newThread, ...prev]);
        setActiveThreadId(newId);
      }
    }
  }, [currentPage]);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];
  const messages = activeThread?.messages || [];

  // Generate page-specific suggestions
  const getSuggestionsForPage = (role: string) => {
    switch (role) {
      case 'SECURITY':
        return [
          { label: "Dispatch Guard 4 to Gate 4", query: "Dispatch Guard Unit 4 to Gate 4 Tunnel" },
          { label: "Check Gate 4 Density", query: "Analyze Gate 4 crowd compression density" },
          { label: "Active Security Alerts", query: "Are there any active security alerts?" }
        ];
      case 'OPS':
        return [
          { label: "Optimize Grid Load", query: "Suggest eco grid load optimization" },
          { label: "Switch HVAC to Eco", query: "Switch HVAC auxiliary nodes to Eco" },
          { label: "Check Power status", query: "Check grid power load status" }
        ];
      case 'FAN':
        return [
          { label: "Short Queue Food", query: "Where can I order food with short queues?" },
          { label: "Order from Green Pitch", query: "Pre-order from Green Pitch Salads" },
          { label: "Burgers wait time", query: "Burgers waiting time at Section 102" }
        ];
      case 'VOLUNTEER':
        return [
          { label: "Coordinate Miller", query: "Coordinate volunteer Robert Miller" },
          { label: "Spanish Gap check", query: "Check Spanish language gap assignments" },
          { label: "Gate 4 support", query: "Gate 4 support procedures" }
        ];
      case 'ACCESSIBILITY':
        return [
          { label: "Wheelchair Escort", query: "Request wheelchair escort for Robert Miller" },
          { label: "Access Nav Steps", query: "Check accessibility navigation steps" },
          { label: "Elevator 3 diagnostics", query: "Elevator 3 diagnostics" }
        ];
      case 'TRANSIT':
        return [
          { label: "Reroute South Loop", query: "Reroute transit shuttles to South Loop" },
          { label: "Egress Surge checks", query: "Egress surge parking lot loops" },
          { label: "Sync Digital signs", query: "Sync digital guidance signage arrays" }
        ];
      default:
        return [
          { label: "Check Operations", query: "Check current stadium operations status" },
          { label: "List Bottlenecks", query: "List critical bottlenecks" },
          { label: "Sustainability Mode", query: "Suggest sustainability eco mode parameters" }
        ];
    }
  };

  const suggestions = getSuggestionsForPage(activeThread?.role || currentRole);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Create new manual thread
  const handleNewThread = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: `New Thread (${currentRole})`,
      role: currentRole,
      messages: [
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Started new thread. Using **${currentRole}** console privileges.\nAsk me anything.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
  };

  // Delete thread
  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (threads.length <= 1) return; // Keep at least one
    const newThreads = threads.filter(t => t.id !== id);
    setThreads(newThreads);
    if (activeThreadId === id) {
      setActiveThreadId(newThreads[0].id);
    }
  };

  // Simulate typewriter / streaming effect
  const runTypewriterStream = (fullText: string, messageId: string) => {
    let index = 0;
    // Set streaming state
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: t.messages.map(m => {
            if (m.id === messageId) {
              return { ...m, text: '', isStreaming: true };
            }
            return m;
          })
        };
      }
      return t;
    }));

    const interval = setInterval(() => {
      index += 4;
      if (index >= fullText.length) {
        clearInterval(interval);
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              messages: t.messages.map(m => {
                if (m.id === messageId) {
                  return { ...m, text: fullText, isStreaming: false };
                }
                return m;
              })
            };
          }
          return t;
        }));
      } else {
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              messages: t.messages.map(m => {
                if (m.id === messageId) {
                  return { ...m, text: fullText.substring(0, index) };
                }
                return m;
              })
            };
          }
          return t;
        }));
      }
    }, 15);
  };

  // Send request
  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update active thread title if it's the first query
    const isFirstQuery = messages.length <= 1;
    let newTitle = activeThread.title;
    if (isFirstQuery) {
      newTitle = queryText.length > 25 ? `${queryText.substring(0, 25)}...` : queryText;
    }

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          title: newTitle,
          messages: [...t.messages, userMsg]
        };
      }
      return t;
    }));

    setQuery('');
    setLoading(true);
    setErrorMsg(null);

    const assistantMsgId = `msg-${Date.now() + 1}`;
    
    // Add temporary loading indicator message
    const tempMsg: ChatMessage = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return { ...t, messages: [...t.messages, tempMsg] };
      }
      return t;
    }));

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer mock-token-${activeThread.role.toLowerCase()}`
        },
        body: JSON.stringify({
          prompt: queryText,
          role: activeThread.role,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Failed to reach AI engine`);
      }

      const data = await response.json();
      
      // Update thread with actual structured completion data but start streaming text
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: t.messages.map(m => {
              if (m.id === assistantMsgId) {
                return {
                  ...m,
                  confidence: data.confidence,
                  explainability: data.explainability,
                  recommendedActions: data.recommendedActions,
                  navigationSteps: data.navigationSteps,
                  emergencyAlert: data.emergencyAlert,
                  language: data.language,
                  translationCompletion: data.translationCompletion
                };
              }
              return m;
            })
          };
        }
        return t;
      }));

      // Stream the response text typewriter style!
      runTypewriterStream(data.completion, assistantMsgId);

    } catch (err: any) {
      console.error("Fetch AI Copilot error:", err);
      setErrorMsg(err.message || "Failed to connect to backend AI Engine.");
      
      const errorFallbackMsg = `⚠️ **Connection Error**: Unable to contact the StadiumOS AI Engine backend (port 3000).\nEnsure that your backend server is running locally via \`npm run dev\`.`;
      
      runTypewriterStream(errorFallbackMsg, assistantMsgId);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: any, msgId: string) => {
    triggerAction(action.actionType, action.payload);
    
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: t.messages.map(m => {
            if (m.id === msgId && m.recommendedActions) {
              return {
                ...m,
                text: `${m.text}\n\n✔️ **Action Triggered**: \`${action.actionType}\` with payload \`${JSON.stringify(action.payload)}\`.`,
                recommendedActions: m.recommendedActions.filter(a => a.actionType !== action.actionType)
              };
            }
            return m;
          })
        };
      }
      return t;
    }));
  };

  const toggleDetails = (msgId: string) => {
    setExpandedDetails(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopyText = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Renders the ChatGPT-style custom chat bubbles
  const renderMessageBubble = (msg: ChatMessage) => {
    const isUser = msg.sender === 'user';
    const isExpanded = !!expandedDetails[msg.id];
    const hasEmergency = msg.emergencyAlert && msg.emergencyAlert.active;

    return (
      <div 
        key={msg.id} 
        className={`group flex gap-4 p-4 rounded-xl transition-all duration-200 ${
          isUser 
            ? 'bg-purple-950/20 border border-purple-500/10 hover:border-purple-500/20' 
            : 'bg-zinc-900/40 border border-zinc-800/80 hover:bg-zinc-900/60'
        }`}
      >
        {/* Avatar badge */}
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 font-mono font-bold text-xs ${
          isUser 
            ? 'bg-purple-600 text-white shadow-lg' 
            : 'bg-zinc-800 border border-zinc-700 text-purple-400'
        }`}>
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </div>

        {/* Bubble content */}
        <div className="flex-grow flex flex-col gap-2 min-w-0">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>{isUser ? 'YOU' : `${selectedModel.toUpperCase()} ADVISOR`}</span>
            <span>{msg.timestamp}</span>
          </div>

          {/* Emergency Alert Pulsing banner */}
          {hasEmergency && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-[11px] text-red-400 flex flex-col gap-1.5 animate-pulse-opacity">
              <div className="flex items-center gap-1.5 font-bold uppercase">
                <AlertTriangle size={14} />
                <span>Emergency Warning ({msg.emergencyAlert?.urgency})</span>
              </div>
              {msg.emergencyAlert?.instructions && (
                <p className="font-mono leading-relaxed">{msg.emergencyAlert.instructions}</p>
              )}
            </div>
          )}

          {/* Text block with typwriter cursor */}
          <div className="text-[11px] md:text-xs text-zinc-200 leading-relaxed font-sans prose prose-invert max-w-none">
            <span 
              dangerouslySetInnerHTML={{ 
                __html: msg.text
                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 border border-zinc-700 text-purple-300 px-1 py-0.5 rounded font-mono text-[10px]">$1</code>')
                  .replace(/- ([^\n]+)/g, '• $1')
              }} 
            />
            {msg.isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-purple-400 ml-1 animate-pulse" />
            )}
          </div>

          {/* Translation/Language banner */}
          {msg.language && msg.language !== 'en' && !msg.isStreaming && (
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 border-t border-zinc-850 pt-2 mt-1 font-mono">
              <Globe size={11} />
              <span>Input: {msg.language.toUpperCase()} | English system backup mapped</span>
            </div>
          )}

          {/* Wayfinding directions */}
          {msg.navigationSteps && msg.navigationSteps.length > 0 && !msg.isStreaming && (
            <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-3 mt-1.5">
              <span className="text-[9px] font-bold text-zinc-400 font-mono tracking-wider">WAYFINDING ROUTING</span>
              <div className="grid gap-1.5">
                {msg.navigationSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-[10px] bg-zinc-950/40 p-2 rounded border border-zinc-850">
                    <Compass size={12} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-sans">{step.instruction}</span>
                      <span className="text-[8px] text-zinc-500 font-mono mt-0.5">Zone: {step.zone} {step.distanceEstimate && `| Est: ${step.distanceEstimate}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions list */}
          {msg.recommendedActions && msg.recommendedActions.length > 0 && !msg.isStreaming && (
            <div className="flex flex-col gap-2 border-t border-zinc-800/80 pt-3 mt-1.5">
              <span className="text-[9px] font-bold text-purple-400 font-mono tracking-wider">RECOMMENDED DECISIONS</span>
              <div className="grid md:grid-cols-2 gap-2">
                {msg.recommendedActions.map((act, idx) => (
                  <div key={idx} className="flex flex-col justify-between gap-1.5 rounded-lg bg-zinc-950/80 p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
                    <div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-zinc-200 uppercase truncate">{act.actionType}</span>
                        <span className={`text-[8px] rounded px-1.5 py-0.5 font-bold ${
                          act.priority === 'CRITICAL' || act.priority === 'HIGH' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>{act.priority}</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-1 leading-normal font-sans">{act.rationale}</p>
                    </div>
                    <button
                      onClick={() => handleActionClick(act, msg.id)}
                      className="mt-2 flex items-center justify-between rounded bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-white font-medium text-[10px] transition-colors cursor-pointer w-full"
                    >
                      <span>Trigger system action</span>
                      <CornerDownRight size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* o1 style Reasoning details */}
          {!isUser && msg.confidence && !msg.isStreaming && (
            <div className="border-t border-zinc-800/85 pt-2.5 mt-2 flex flex-col">
              <button 
                onClick={() => toggleDetails(msg.id)}
                className="flex justify-between items-center text-[9px] text-zinc-500 font-mono hover:text-zinc-300 text-left w-full cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-emerald-500" />
                  <span>Score: {Math.round(msg.confidence.score * 100)}% Confidence • Explainable Reasoning</span>
                </span>
                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>

              {isExpanded && msg.explainability && (
                <div className="bg-zinc-950/90 border border-zinc-850/80 rounded-lg p-3 mt-2 text-[10px] text-zinc-400 leading-relaxed flex flex-col gap-2">
                  <div>
                    <strong className="text-zinc-300 font-mono text-[9px] block">PRIMARY FACTORS ANALYZED:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.explainability.primaryFactors.map((f, i) => (
                        <span key={i} className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono text-[8px]">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong className="text-zinc-300 font-mono text-[9px] block">REASONING THINKING CHAIN:</strong>
                    <p className="mt-1 font-sans text-zinc-400">{msg.explainability.reasoningChain}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Copy and Regenerate floating action buttons */}
          {!isUser && !msg.isStreaming && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 mt-2 pt-1.5 border-t border-zinc-850/50 self-end transition-opacity duration-150">
              <button 
                onClick={() => handleCopyText(msg.text, msg.id)}
                className="flex items-center gap-1 hover:text-white text-zinc-500 p-1 rounded font-mono text-[9px] transition-colors cursor-pointer"
                title="Copy to clipboard"
              >
                {copiedId === msg.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                <span>{copiedId === msg.id ? 'Copied!' : 'Copy'}</span>
              </button>
              <button 
                onClick={() => handleQuery(messages[messages.length - 2]?.text || msg.text)}
                className="flex items-center gap-1 hover:text-white text-zinc-500 p-1 rounded font-mono text-[9px] transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <RotateCcw size={10} />
                <span>Regen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render ChatGPT landing recommendations cards for empty threads
  const renderChatGPTLanding = () => {
    return (
      <div className="flex-grow flex flex-col justify-center items-center py-12 max-w-2xl mx-auto w-full text-center px-4">
        <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 shadow-xl mb-4">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-zinc-200 font-mono">StadiumOS Decision-Support Chat</h2>
        <p className="text-zinc-500 text-xs mt-1.5 max-w-md font-sans">
          Select a quick prompt category or ask any question to evaluate live stadium sensors, utilities, and safety telemetry grids.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(sug.query)}
              className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700/80 p-3.5 rounded-xl text-left transition-all duration-200 group cursor-pointer"
            >
              <span className="font-mono text-[10px] font-bold text-purple-400 block group-hover:text-purple-300 transition-colors uppercase">{sug.label}</span>
              <span className="text-[11px] text-zinc-400 block mt-1 line-clamp-2 leading-relaxed">{sug.query}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // FULLSCREEN MODE VIEW
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
        {/* ChatGPT Left Sidebar Threads Panel */}
        <div className="w-[260px] bg-zinc-900 border-r border-zinc-800 flex flex-col p-3.5 h-full flex-shrink-0">
          <button
            onClick={handleNewThread}
            className="w-full border border-zinc-700/80 hover:bg-zinc-800 text-zinc-200 text-xs py-2.5 px-3 rounded-lg flex items-center justify-between font-medium transition-all duration-150 cursor-pointer shadow-md mb-4"
          >
            <span className="flex items-center gap-2">
              <Plus size={14} />
              <span>New thread</span>
            </span>
            <MessageSquare size={12} className="text-zinc-500" />
          </button>

          {/* Threads list */}
          <div className="flex-grow overflow-y-auto flex flex-col gap-1.5 pr-1 text-xs">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider px-2 block mb-1">CONSOLES & CHATS</span>
            {threads.map((t) => {
              const isActive = t.id === activeThreadId;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`group flex items-center justify-between rounded-lg p-2.5 cursor-pointer transition-all duration-150 ${
                    isActive 
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700/50' 
                      : 'hover:bg-zinc-850/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare size={13} className={isActive ? "text-purple-400" : "text-zinc-500"} />
                    <span className="truncate pr-2 font-mono text-[11px]">{t.title}</span>
                  </div>
                  {threads.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteThread(t.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 p-0.5 transition-opacity duration-150"
                      title="Delete thread"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Console Info panel */}
          <div className="border-t border-zinc-800 pt-3.5 mt-auto flex flex-col gap-2">
            <div className="flex justify-between items-center bg-zinc-950/80 border border-zinc-800 px-3 py-2 rounded-lg text-[10px]">
              <span className="text-zinc-500 font-mono">WORKSPACE</span>
              <span className="rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1.5 py-0.5 font-bold font-mono">
                {activeThread?.role || currentRole}
              </span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 py-2.5 text-xs text-zinc-300 font-medium transition-colors cursor-pointer w-full"
            >
              <Minimize2 size={13} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* ChatGPT Right Center Main Message Pane */}
        <div className="flex-grow flex flex-col h-full overflow-hidden bg-zinc-950">
          {/* Top Bar */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-zinc-800 bg-zinc-900/30 flex-shrink-0">
            {/* ChatGPT style Model Selector */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-zinc-400 font-bold">MODEL:</span>
              <div className="relative flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono shadow-inner">
                <button
                  onClick={() => setSelectedModel('stadium-4o')}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    selectedModel === 'stadium-4o' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ⚡ StadiumOS-4o
                </button>
                <button
                  onClick={() => setSelectedModel('stadium-o1')}
                  className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1 ${
                    selectedModel === 'stadium-o1' 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Cpu size={10} />
                  <span>StadiumOS-o1</span>
                </button>
              </div>
            </div>

            {/* Minimize and Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI CO-PILOT ACTIVE</span>
              </div>
              <button 
                onClick={() => setIsFullscreen(false)}
                className="text-zinc-400 hover:text-white p-2 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Minimize screen"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* ChatGPT Message Area */}
          <div className="flex-grow overflow-y-auto px-4 md:px-12 py-6 flex flex-col gap-4 max-w-3xl mx-auto w-full min-h-0">
            {messages.length <= 1 ? (
              renderChatGPTLanding()
            ) : (
              messages.map(renderMessageBubble)
            )}
            
            {loading && !messages[messages.length - 1]?.isStreaming && (
              <div className="flex gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 animate-pulse">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-purple-400 flex-shrink-0">
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="h-3 w-24 bg-zinc-800 rounded font-mono text-[9px] text-zinc-500">Reasoning...</div>
                  <div className="h-3.5 bg-zinc-800 rounded w-5/6"></div>
                  <div className="h-3.5 bg-zinc-800 rounded w-3/4"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ChatGPT Prompt Inputs */}
          <div className="p-4 md:p-6 bg-zinc-900/10 border-t border-zinc-900/80 flex-shrink-0">
            <div className="max-w-3xl mx-auto relative bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1.5">
              <textarea
                placeholder={`Send a message to StadiumOS AI Advisor... (${activeThread?.role} Console)`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery(query);
                  }
                }}
                disabled={loading}
                rows={2}
                className="w-full resize-none bg-transparent px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none border-0 focus:ring-0 focus:outline-none disabled:opacity-50 font-sans leading-relaxed"
              />
              <div className="flex justify-between items-center border-t border-zinc-850 pt-2 px-2">
                <div className="flex items-center gap-2">
                  <button className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer" title="Attach file">
                    <Paperclip size={14} />
                  </button>
                  <span className="text-[9px] font-mono text-zinc-600">Press Enter to send, Shift+Enter for new line</span>
                </div>
                <button
                  onClick={() => handleQuery(query)}
                  disabled={!query.trim() || loading}
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-30 disabled:hover:bg-purple-600 transition-all cursor-pointer shadow-md"
                  aria-label="Send message"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SIDEBAR COMPACT VIEW (ChatGPT Interface scaled down)
  return (
    <div 
      className="flex flex-col gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950 p-4.5 w-full md:max-w-[320px] h-[calc(100vh-100px)] sticky top-[70px] shadow-2xl overflow-hidden" 
      aria-label="AI Recommendations and Copilot"
    >
      {/* Title block with maximize */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-purple-400 animate-pulse" />
          <h3 className="font-semibold text-xs text-zinc-200">StadiumOS AI Copilot</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1"
            title="Expand to Fullscreen ChatGPT Mode"
          >
            <span className="text-[8px] font-mono text-zinc-500">ChatGPT Mode</span>
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Mode selectors & Active Role Badge */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-850 px-2.5 py-1.5 rounded-lg text-[10px] flex-shrink-0">
        <span className="text-purple-400 font-bold uppercase tracking-wider font-mono">
          {activeThread?.role || currentRole}
        </span>
        
        {/* Model quick select */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as any)}
          className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] text-zinc-300 font-mono outline-none"
        >
          <option value="stadium-4o">⚡ Stadium-4o</option>
          <option value="stadium-o1">🤖 Stadium-o1</option>
        </select>
      </div>

      {/* Message Area */}
      <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3 min-h-0 text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isExpanded = !!expandedDetails[msg.id];
          const hasEmergency = msg.emergencyAlert && msg.emergencyAlert.active;

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col gap-1.5 rounded-lg p-2.5 max-w-[96%] border ${
                isUser 
                  ? 'self-end bg-purple-600/10 border-purple-500/20 text-zinc-100 ml-6' 
                  : 'self-start bg-zinc-900/60 border-zinc-850 text-zinc-300 mr-6'
              }`}
            >
              {/* Emergency Alert Pulsing banner */}
              {hasEmergency && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-1.5 text-[9px] text-red-400 flex flex-col gap-0.5 animate-pulse-opacity">
                  <div className="flex items-center gap-1 font-bold uppercase">
                    <AlertTriangle size={10} />
                    <span>Warning ({msg.emergencyAlert?.urgency})</span>
                  </div>
                  {msg.emergencyAlert?.instructions && (
                    <p className="font-mono leading-tight">{msg.emergencyAlert.instructions}</p>
                  )}
                </div>
              )}

              {/* Message text */}
              <div 
                className="whitespace-pre-wrap leading-relaxed prose prose-invert font-normal text-[11px] font-sans"
                dangerouslySetInnerHTML={{ 
                  __html: msg.text
                    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-purple-300 px-1 py-0.5 rounded font-mono text-[9px]">$1</code>')
                    .replace(/- ([^\n]+)/g, '• $1')
                }}
              />
              {msg.isStreaming && (
                <span className="inline-block w-1 h-3 bg-purple-400 ml-0.5 animate-pulse" />
              )}

              {/* Translator indicator */}
              {msg.language && msg.language !== 'en' && !msg.isStreaming && (
                <div className="flex items-center gap-1 text-[8px] text-zinc-500 border-t border-zinc-850 pt-1.5 mt-0.5 font-mono">
                  <Globe size={9} />
                  <span>Input: {msg.language.toUpperCase()} | English mapped</span>
                </div>
              )}

              {/* Wayfinding nav steps */}
              {msg.navigationSteps && msg.navigationSteps.length > 0 && !msg.isStreaming && (
                <div className="flex flex-col gap-1 border-t border-zinc-850 pt-2 mt-1">
                  <div className="text-[8px] font-semibold text-zinc-400 font-mono tracking-wider">WAYFINDING NAV</div>
                  <div className="flex flex-col gap-1">
                    {msg.navigationSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-1 items-start text-[9px] bg-zinc-950/40 p-1.5 rounded border border-zinc-850">
                        <Compass size={10} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-zinc-300">{step.instruction}</span>
                          <span className="text-[8px] text-zinc-500 font-mono">Zone: {step.zone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action buttons */}
              {msg.recommendedActions && msg.recommendedActions.length > 0 && !msg.isStreaming && (
                <div className="flex flex-col gap-1 border-t border-zinc-850 pt-2 mt-1">
                  <div className="text-[8px] font-semibold text-purple-400 font-mono tracking-wider">RECOMMENDED SYSTEM ACTIONS</div>
                  <div className="flex flex-col gap-1.5">
                    {msg.recommendedActions.map((act, idx) => (
                      <div key={idx} className="flex flex-col gap-1 rounded bg-zinc-950/60 p-2 border border-zinc-850">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[8px] font-bold text-zinc-300 uppercase">{act.actionType}</span>
                          <span className="text-[7px] bg-red-500/10 text-red-400 border border-red-500/20 rounded px-1 font-bold">{act.priority}</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 leading-normal">{act.rationale}</p>
                        <button
                          onClick={() => handleActionClick(act, msg.id)}
                          className="mt-1 flex items-center justify-between rounded bg-purple-600 hover:bg-purple-500 px-2 py-0.5 font-medium text-white text-[9px] transition-colors cursor-pointer w-full"
                        >
                          <span>Execute Action</span>
                          <CornerDownRight size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explainability toggle */}
              {!isUser && msg.confidence && !msg.isStreaming && (
                <div className="border-t border-zinc-850 pt-1.5 mt-1 flex flex-col">
                  <button 
                    onClick={() => toggleDetails(msg.id)}
                    className="flex justify-between items-center text-[8px] text-zinc-500 font-mono hover:text-zinc-300 text-left w-full cursor-pointer"
                  >
                    <span>Score: {Math.round(msg.confidence.score * 100)}% Confidence</span>
                    {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  </button>

                  {isExpanded && msg.explainability && (
                    <div className="bg-zinc-950 border border-zinc-850 rounded p-2 mt-1 text-[8px] text-zinc-400 leading-relaxed flex flex-col gap-1.5">
                      <div>
                        <strong className="text-zinc-300 font-mono block">REASONING:</strong>
                        <p className="mt-0.5">{msg.explainability.reasoningChain}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <span className="font-mono text-[8px] text-zinc-600 self-end mt-0.5">{msg.timestamp}</span>
            </div>
          );
        })}

        {loading && !messages[messages.length - 1]?.isStreaming && (
          <div className="self-start flex gap-2 items-center bg-zinc-900/60 border border-zinc-850 text-zinc-500 rounded-lg p-2.5 max-w-[85%] font-mono text-[9px] animate-pulse">
            <Loader2 size={11} className="animate-spin text-purple-400" />
            <span>Analyzing stadium telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 border-t border-zinc-800 pt-2">
        <span className="font-mono text-[8px] text-zinc-500 uppercase px-1">Quick Suggestions</span>
        <div className="flex flex-wrap gap-1 max-h-[65px] overflow-y-auto pr-0.5">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleQuery(sug.query)}
              className="bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-200 border border-zinc-800 rounded px-2 py-0.5 text-[9px] text-zinc-400 transition-colors text-left truncate max-w-[98%] cursor-pointer"
            >
              {sug.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleQuery(query);
        }}
        className="flex gap-2 border-t border-zinc-800 pt-3 flex-shrink-0"
      >
        <input 
          type="text" 
          placeholder="Ask StadiumOS Advisor..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="flex-grow rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 disabled:opacity-50 font-sans"
        />
        <button 
          type="submit" 
          disabled={!query.trim() || loading}
          className="flex h-8.5 w-8.5 items-center justify-center rounded bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
          aria-label="Send query"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
