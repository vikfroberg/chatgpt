import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2, ArrowLeft, X, Plus, Settings, Copy, Check } from 'lucide-react';

// Simple markdown renderer component
const MarkdownRenderer = ({ content }) => {
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Parse markdown content
  const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLang = '';
    let codeBlockId = '';

    while (i < lines.length) {
      const line = lines[i];
      
      // Code blocks - handle triple backticks more carefully
      if (line.trim().startsWith('```') && !inCodeBlock) {
        // Starting code block
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
        codeBlockContent = '';
        codeBlockId = `code-${Date.now()}-${Math.random()}`;
        i++;
        continue;
      } else if (line.trim() === '```' && inCodeBlock) {
        // Ending code block
        inCodeBlock = false;
        elements.push(
          <div key={`codeblock-${i}`} className="my-6 relative group">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-sm">
                <span>{codeBlockLang || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(codeBlockContent, codeBlockId)}
                  className="flex items-center space-x-1 px-3 py-1.5 hover:bg-gray-700 active:bg-gray-600 rounded text-xs transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  {copiedCode === codeBlockId ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-gray-100 text-sm font-mono leading-relaxed">
                  {codeBlockContent}
                </code>
              </pre>
            </div>
          </div>
        );
        i++;
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        i++;
        continue;
      }

      // Headers with better spacing
      if (line.startsWith('# ')) {
        elements.push(<h1 key={`h1-${i}`} className="text-2xl font-bold mt-8 mb-4 text-gray-900 first:mt-0">{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i}`} className="text-xl font-bold mt-7 mb-3 text-gray-900 first:mt-0">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`} className="text-lg font-bold mt-6 mb-3 text-gray-900 first:mt-0">{line.slice(4)}</h3>);
      } 
      // Lists with better spacing
      else if (line.match(/^\d+\.\s/)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
          const content = lines[i].replace(/^\d+\.\s/, '');
          listItems.push(<li key={`li-${i}`} className="mb-2">{parseInlineMarkdown(content)}</li>);
          i++;
        }
        elements.push(<ol key={`ol-${i}`} className="list-decimal list-inside my-4 space-y-1 pl-4">{listItems}</ol>);
        continue;
      } else if (line.match(/^[-*]\s/)) {
        const listItems = [];
        while (i < lines.length && lines[i].match(/^[-*]\s/)) {
          const content = lines[i].replace(/^[-*]\s/, '');
          listItems.push(<li key={`li-${i}`} className="mb-2">{parseInlineMarkdown(content)}</li>);
          i++;
        }
        elements.push(<ul key={`ul-${i}`} className="list-disc list-inside my-4 space-y-1 pl-4">{listItems}</ul>);
        continue;
      }
      // Empty lines - add more spacing
      else if (line.trim() === '') {
        if (elements.length > 0 && !elements[elements.length - 1]?.key?.includes('br')) {
          elements.push(<div key={`br-${i}`} className="h-4" />);
        }
      }
      // Regular paragraphs with better spacing
      else {
        elements.push(<p key={`p-${i}`} className="mb-4 leading-relaxed text-gray-900">{parseInlineMarkdown(line)}</p>);
      }
      
      i++;
    }

    return elements;
  };

  // Parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text) => {
    const parts = [];
    let currentText = text;
    let key = 0;

    // Process inline elements
    while (currentText.length > 0) {
      // Inline code
      const codeMatch = currentText.match(/`([^`]+)`/);
      if (codeMatch) {
        const beforeCode = currentText.slice(0, codeMatch.index);
        if (beforeCode) {
          parts.push(parseTextFormatting(beforeCode, key++));
        }
        parts.push(
          <code key={key++} className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-sm font-mono">
            {codeMatch[1]}
          </code>
        );
        currentText = currentText.slice(codeMatch.index + codeMatch[0].length);
        continue;
      }

      // No more special formatting, process remaining text
      parts.push(parseTextFormatting(currentText, key++));
      break;
    }

    return parts;
  };

  // Parse bold and italic
  const parseTextFormatting = (text, key) => {
    const parts = [];
    let remaining = text;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.slice(0, boldMatch.index);
        if (beforeBold) {
          parts.push(<span key={`${key}-${partKey++}`}>{beforeBold}</span>);
        }
        parts.push(<strong key={`${key}-${partKey++}`} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic
      const italicMatch = remaining.match(/\*([^*]+)\*/);
      if (italicMatch) {
        const beforeItalic = remaining.slice(0, italicMatch.index);
        if (beforeItalic) {
          parts.push(<span key={`${key}-${partKey++}`}>{beforeItalic}</span>);
        }
        parts.push(<em key={`${key}-${partKey++}`} className="italic">{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more formatting
      parts.push(<span key={`${key}-${partKey++}`}>{remaining}</span>);
      break;
    }

    return parts;
  };

  return <div className="prose prose-gray max-w-none">{parseMarkdown(content)}</div>;
};

const ChatGPTUI = () => {
  const [conversations, setConversations] = useState([
    { id: 'main', title: 'New Chat', messages: [], isMain: true }
  ]);
  const [activeConversationId, setActiveConversationId] = useState('main');
  const [inputs, setInputs] = useState({ main: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0 });
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    maxTokens: 1500,
    temperature: 0.7,
    model: 'gpt-4o'
  });

  // Generate chat title from first message and response
  const generateChatTitle = async (userMessage, assistantResponse) => {
    if (!apiKey.trim()) return 'New Chat';
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Generate a short, descriptive title (2-6 words) for a chat conversation based on the user\'s first message and assistant\'s response. Return only the title, no quotes or extra text.'
            },
            {
              role: 'user',
              content: `User asked: "${userMessage}"\nAssistant replied: "${assistantResponse.substring(0, 200)}..."\n\nGenerate a concise title:`
            }
          ],
          max_tokens: 20,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content.trim().replace(/['"]/g, '') || 'New Chat';
      }
    } catch (error) {
      console.error('Error generating title:', error);
    }
    
    return 'New Chat';
  };
  const messagesEndRef = useRef(null);
  const inputRefs = useRef({});

  const saveApiKey = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      setShowApiInput(false);
    }
  };

  const changeApiKey = () => {
    setTempApiKey(apiKey);
    setShowApiInput(true);
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentInput = inputs[activeConversationId] || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  // Handle text selection
  const handleTextSelection = (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(selectedText);
      setTooltip({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10 // Fixed position accounting for scroll
      });
    } else {
      setTooltip({ show: false, x: 0, y: 0 });
      setSelectedText('');
    }
  };

  // Hide tooltip when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.tooltip-container')) {
        setTooltip({ show: false, x: 0, y: 0 });
        setSelectedText('');
      }
      if (!e.target.closest('.settings-panel') && !e.target.closest('.settings-button')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create detour conversation with selected text in input
  const createDetourConversation = (type = 'explore') => {
    if (!selectedText) return;

    const newConversationId = `detour-${Date.now()}`;
    let title, inputText, messages, autoSend = false;

    switch (type) {
      case 'lookup':
        title = `Lookup: "${selectedText.substring(0, 25)}${selectedText.length > 25 ? '...' : ''}"`;
        inputText = `What does "${selectedText}" mean?`;
        
        const lookupContextMessages = activeConversation?.messages
          .filter(m => !m.isContext)
          .slice(-4) || [];
        
        messages = [
          {
            role: 'system',
            content: JSON.stringify({ type: 'lookup', term: selectedText }),
            isContext: true
          },
          {
            role: 'assistant',
            content: '--- Previous Context ---',
            isContextSeparator: true
          },
          ...lookupContextMessages,
          {
            role: 'assistant', 
            content: '--- Dictionary Lookup ---',
            isContextSeparator: true
          }
        ];
        autoSend = true;
        break;
      case 'focus':
        title = `Focus: "${selectedText.substring(0, 25)}${selectedText.length > 25 ? '...' : ''}"`;
        inputText = `"${selectedText}"`;
        messages = [
          {
            role: 'system',
            content: JSON.stringify({ type: 'focus', term: selectedText }),
            isContext: true
          }
        ];
        break;
      case 'explore':
      default:
        title = `Explore: "${selectedText.substring(0, 25)}${selectedText.length > 25 ? '...' : ''}"`;
        inputText = `"${selectedText}"`;
        
        const contextMessages = activeConversation?.messages
          .filter(m => !m.isContext)
          .slice(-4) || [];
        
        messages = [
          {
            role: 'system',
            content: JSON.stringify({ type: 'explore', term: selectedText }),
            isContext: true
          },
          {
            role: 'assistant',
            content: '--- Previous Context ---',
            isContextSeparator: true
          },
          ...contextMessages,
          {
            role: 'assistant', 
            content: '--- Continuing Conversation ---',
            isContextSeparator: true
          }
        ];
        break;
    }

    const newConversation = {
      id: newConversationId,
      title,
      messages,
      parentId: activeConversationId,
      isMain: false,
      type
    };

    setConversations(prev => [...prev, newConversation]);
    setInputs(prev => ({
      ...prev,
      [newConversationId]: autoSend ? '' : inputText
    }));
    setActiveConversationId(newConversationId);
    setTooltip({ show: false, x: 0, y: 0 });
    setSelectedText('');

    if (autoSend && apiKey.trim()) {
      const userMessage = { role: 'user', content: inputText };
      setConversations(prev => prev.map(c => 
        c.id === newConversationId 
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      ));
      
      // Add placeholder assistant message for streaming
      const assistantMessageId = Date.now();
      const placeholderMessage = {
        role: 'assistant',
        content: '',
        id: assistantMessageId,
        isStreaming: true
      };
      
      setConversations(prev => prev.map(c => 
        c.id === newConversationId 
          ? { ...c, messages: [...c.messages, placeholderMessage] }
          : c
      ));
      
      setIsLoading(true);
      
      // Use streaming API call for auto-send
      getOpenAIResponse(inputText, newConversation, (chunk) => {
        // Update the streaming message with new content
        setConversations(prev => prev.map(c => 
          c.id === newConversationId 
            ? {
                ...c, 
                messages: c.messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              }
            : c
        ));
      })
        .then(() => {
          // Mark streaming as complete
          setConversations(prev => prev.map(c => 
            c.id === newConversationId 
              ? {
                  ...c, 
                  messages: c.messages.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, isStreaming: false }
                      : m
                  )
                }
              : c
          ));
        })
        .catch(error => {
          console.error('Error:', error);
          
          // Replace placeholder with error message
          setConversations(prev => prev.map(c => 
            c.id === newConversationId 
              ? {
                  ...c, 
                  messages: c.messages.map(m => 
                    m.id === assistantMessageId 
                      ? { 
                          ...m, 
                          content: `Sorry, I encountered an error: ${error.message}`,
                          isStreaming: false 
                        }
                      : m
                  )
                }
              : c
          ));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (autoSend && !apiKey.trim()) {
      setInputs(prev => ({
        ...prev,
        [newConversationId]: inputText
      }));
      setTimeout(() => {
        const inputRef = inputRefs.current[newConversationId];
        if (inputRef) {
          inputRef.focus();
          inputRef.setSelectionRange(inputText.length, inputText.length);
        }
      }, 100);
    } else {
      setTimeout(() => {
        const inputRef = inputRefs.current[newConversationId];
        if (inputRef) {
          inputRef.focus();
          inputRef.setSelectionRange(inputText.length, inputText.length);
        }
      }, 100);
    }
  };

  // Get OpenAI response with streaming
  const getOpenAIResponse = async (userMessage, conversation, onChunk) => {
    if (!apiKey.trim()) {
      throw new Error('Please enter your OpenAI API key');
    }

    let systemPrompt = "You are ChatGPT, a helpful AI assistant.";
    
    if (!conversation.isMain) {
      const contextMessage = conversation.messages.find(m => m.isContext);
      let contextData = {};
      
      try {
        contextData = JSON.parse(contextMessage?.content || '{}');
      } catch (e) {
        contextData = { type: 'explore', term: '' };
      }

      const { type } = contextData;

      switch (type) {
        case 'lookup':
          systemPrompt = `You are a helpful dictionary and reference assistant with access to the conversation context. When asked about terms, provide comprehensive definitions including etymology, pronunciation guides, usage examples, and related terms. Use the previous conversation context to give more relevant and contextualized explanations. Focus on being educational and thorough like a high-quality dictionary or encyclopedia, but tailor your explanation to fit the context of the ongoing discussion.`;
          break;
        case 'focus':
          systemPrompt = `You are a focused AI assistant. The user has selected a specific topic or phrase to discuss in isolation. Provide detailed, focused analysis of just this topic without referencing other conversations or broader context unless directly relevant to understanding the selected topic.`;
          break;
        case 'explore':
          systemPrompt = `You are ChatGPT continuing a previous conversation. The user has selected a specific part of our previous discussion to explore further. You have access to the previous conversation context and should reference it when relevant to provide deeper, more connected insights.`;
          break;
      }
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt }
    ];

    const conversationHistory = conversation.messages
      .filter(m => !m.isContext && !m.isContextSeparator)
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    apiMessages.push(...conversationHistory);
    apiMessages.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: apiMessages,
          max_tokens: apiSettings.maxTokens,
          temperature: apiSettings.temperature,
          stream: true
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your API key permissions.');
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return fullResponse;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullResponse += content;
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
      
      return fullResponse;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!currentInput.trim()) return;
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key first');
      return;
    }
    
    const conversation = conversations.find(c => c.id === activeConversationId);
    const userMessage = { role: 'user', content: currentInput.trim() };
    const isFirstMessage = conversation.messages.filter(m => !m.isContext && !m.isContextSeparator).length === 0;
    
    // Add user message
    setConversations(prev => prev.map(c => 
      c.id === activeConversationId 
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ));
    
    // Add placeholder assistant message for streaming
    const assistantMessageId = Date.now();
    const placeholderMessage = {
      role: 'assistant',
      content: '',
      id: assistantMessageId,
      isStreaming: true
    };
    
    setConversations(prev => prev.map(c => 
      c.id === activeConversationId 
        ? { ...c, messages: [...c.messages, placeholderMessage] }
        : c
    ));
    
    const messageContent = currentInput.trim();
    setInputs(prev => ({ ...prev, [activeConversationId]: '' }));
    setIsLoading(true);

    try {
      let fullResponse = '';
      await getOpenAIResponse(messageContent, conversation, (chunk) => {
        fullResponse += chunk;
        // Update the streaming message with new content
        setConversations(prev => prev.map(c => 
          c.id === activeConversationId 
            ? {
                ...c, 
                messages: c.messages.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              }
            : c
        ));
      });

      // Mark streaming as complete
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId 
          ? {
              ...c, 
              messages: c.messages.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, isStreaming: false }
                  : m
              )
            }
          : c
      ));

      // Generate and update chat title if this is the first message
      if (isFirstMessage && conversation.isMain) {
        const newTitle = await generateChatTitle(messageContent, fullResponse);
        setConversations(prev => prev.map(c => 
          c.id === activeConversationId 
            ? { ...c, title: newTitle }
            : c
        ));
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Replace placeholder with error message
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId 
          ? {
              ...c, 
              messages: c.messages.map(m => 
                m.id === assistantMessageId 
                  ? { 
                      ...m, 
                      content: `Sorry, I encountered an error: ${error.message}`,
                      isStreaming: false 
                    }
                  : m
              )
            }
          : c
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (value) => {
    setInputs(prev => ({ ...prev, [activeConversationId]: value }));
  };

  const clearChat = () => {
    setConversations(prev => prev.map(c => 
      c.id === activeConversationId ? { ...c, messages: c.isMain ? [] : c.messages.filter(m => m.isContext) } : c
    ));
  };

  const closeDetourConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation && conversation.parentId) {
      setActiveConversationId(conversation.parentId);
    }
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[conversationId];
      return newInputs;
    });
  };

  const goBackToParent = () => {
    const conversation = conversations.find(c => c.id === activeConversationId);
    if (conversation && conversation.parentId) {
      setActiveConversationId(conversation.parentId);
    }
  };

  const newChat = () => {
    const newConversationId = `main-${Date.now()}`;
    const newConversation = {
      id: newConversationId,
      title: 'New Chat',
      messages: [],
      isMain: true
    };
    setConversations(prev => [...prev, newConversation]);
    setInputs(prev => ({ ...prev, [newConversationId]: '' }));
    setActiveConversationId(newConversationId);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Monochrome Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New chat</span>
          </button>
        </div>

        {/* API Key Section */}
        {showApiInput && (
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">API Key Required</p>
              <input
                type="password"
                placeholder="sk-..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
              <button
                onClick={saveApiKey}
                disabled={!tempApiKey.trim()}
                className="w-full px-3 py-2 bg-white text-gray-900 hover:bg-gray-100 active:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Save API Key
              </button>
            </div>
          </div>
        )}

        {/* API Key Status */}
        {apiKey.trim() && !showApiInput && (
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={changeApiKey}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>API Connected</span>
            </button>
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`group relative mb-1 cursor-pointer rounded-lg transition-all duration-200 transform hover:scale-105 ${
                activeConversationId === conversation.id 
                  ? 'bg-gray-700 shadow-lg' 
                  : 'hover:bg-gray-800'
              }`}
              onClick={() => setActiveConversationId(conversation.id)}
            >
              <div className="flex items-center px-3 py-2.5">
                <MessageSquare className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate font-medium">
                    {conversation.title}
                  </p>
                  {conversation.messages.filter(m => !m.isContext && !m.isContextSeparator && m.role !== 'system').length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {conversation.messages.filter(m => !m.isContext && !m.isContextSeparator && m.role !== 'system').length} messages
                    </p>
                  )}
                </div>
                {!conversation.isMain && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeDetourConversation(conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 active:bg-gray-500 rounded transition-all duration-200 transform hover:scale-110 active:scale-95"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {!activeConversation?.isMain && (
              <button
                onClick={goBackToParent}
                className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">
              {activeConversation?.title || 'ChatGPT'}
            </h1>
          </div>
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" onMouseUp={handleTextSelection}>
          {activeConversation?.messages.filter(m => !m.isContext && !m.isContextSeparator && m.role !== 'system').length === 0 && (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">How can I help you today?</h3>
                <p className="text-gray-500">
                  {!apiKey.trim() ? "Save your API key to get started." : "Start a new conversation below."}
                </p>
              </div>
            </div>
          )}

          {activeConversation?.messages.filter(m => !m.isContext).map((message, index) => {
            if (message.isContextSeparator) {
              return (
                <div key={index} className="flex justify-center py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {message.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={message.id || index} className="group px-4 py-6 hover:bg-gray-50 transition-all duration-200">
                <div className="max-w-3xl mx-auto flex space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-medium transition-all duration-200 ${
                    message.role === 'assistant' ? 'bg-gray-900' : 'bg-gray-700'
                  }`}>
                    {message.role === 'assistant' ? 'AI' : 'You'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {message.role === 'assistant' ? (
                      <MarkdownRenderer content={message.content} isStreaming={message.isStreaming} />
                    ) : (
                      <div className="prose prose-gray max-w-none">
                        <p className="whitespace-pre-wrap text-gray-900 leading-relaxed select-text">
                          {message.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && activeConversation?.messages.filter(m => !m.isContext && !m.isStreaming).length === activeConversation?.messages.filter(m => !m.isContext).length && (
            <div className="group px-4 py-6 bg-gray-50">
              <div className="max-w-3xl mx-auto flex space-x-4">
                <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 text-white text-sm font-medium">
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={(el) => inputRefs.current[activeConversationId] = el}
                value={currentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message ChatGPT..."
                className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none max-h-32 overflow-y-auto text-gray-900 placeholder-gray-500 transition-all duration-200"
                rows="2"
                style={{ minHeight: '80px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`settings-button p-2 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                    showSettings 
                      ? 'bg-gray-900 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!currentInput.trim() || !apiKey.trim() || isLoading}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced Settings Panel */}
            {showSettings && (
              <div className="settings-panel mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-xl animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">API Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                    title="Close settings"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Model</label>
                    <select
                      value={apiSettings.model}
                      onChange={(e) => setApiSettings(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white transition-all duration-200"
                    >
                      <option value="gpt-4o">GPT-4o (Latest)</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Max Tokens: <span className="font-semibold">{apiSettings.maxTokens}</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="16384"
                        step="100"
                        value={apiSettings.maxTokens}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Temperature: <span className="font-semibold">{apiSettings.temperature}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={apiSettings.temperature}
                        onChange={(e) => setApiSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-white p-3 rounded border">
                    <p><strong>Temperature:</strong> Higher values (1.0+) make output more creative, lower values (0.1-0.5) make it more focused.</p>
                    <p className="mt-1"><strong>Max Tokens:</strong> Maximum length of the response. Higher values allow longer responses.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selection Tooltip */}
      {tooltip.show && (
        <div
          className="tooltip-container absolute z-50 transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex">
              <button
                onClick={() => createDetourConversation('lookup')}
                className="px-4 py-2 text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 border-r border-gray-700 transform hover:scale-105 active:scale-95"
              >
                Look up
              </button>
              <button
                onClick={() => createDetourConversation('explore')}
                className="px-4 py-2 text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 border-r border-gray-700 transform hover:scale-105 active:scale-95"
              >
                Explore
              </button>
              <button
                onClick={() => createDetourConversation('focus')}
                className="px-4 py-2 text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                Focus
              </button>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatGPTUI;
