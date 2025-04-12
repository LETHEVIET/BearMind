import React, { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { getBrowserTabs } from '@/utils/browser-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the type for text chunks that we'll search through
interface TextChunk {
  id: number;
  text: string;
  startOffset: number; // Start position in the original document
  endOffset: number; // End position in the original document
  element: string; // Information about the containing element
}

// Define the props for the QuoteFinder component
interface QuoteFinderProps {
  onClose?: () => void;
}

export function QuoteFinder({ onClose }: QuoteFinderProps) {
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  // State for search results
  const [searchResults, setSearchResults] = useState<Array<Fuse.FuseResult<TextChunk>>>([]);
  // State to track if content is being extracted
  const [isExtracting, setIsExtracting] = useState(false);
  // State to store the text chunks from the current page
  const [textChunks, setTextChunks] = useState<TextChunk[]>([]);
  // State to store Fuse instance
  const [fuseInstance, setFuseInstance] = useState<Fuse<TextChunk> | null>(null);
  // State to track current tab ID
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);

  // Fuse.js options
  const fuseOptions = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.3,
    keys: ['text']
  };

  // Extract text from the current tab when component mounts
  useEffect(() => {
    extractTextFromCurrentTab();
  }, []);

  // Create Fuse instance when textChunks changes
  useEffect(() => {
    if (textChunks.length > 0) {
      const fuse = new Fuse(textChunks, fuseOptions);
      setFuseInstance(fuse);
    }
  }, [textChunks]);

  // Function to extract text content from the current tab
  const extractTextFromCurrentTab = async () => {
    console.log('Extracting text from current tab...');
    setIsExtracting(true);
    try {
      // Get the current tab
      const { currentTab } = await getBrowserTabs();
      
      if (!currentTab || !currentTab.id) {
        console.error('No current tab found');
        return;
      }

      setCurrentTabId(currentTab.id);
      
      // Script to execute in the tab to extract all text content
      const extractionScript = {
        target: { tabId: currentTab.id },
        function: () => {
          // Function to check if an element is visible
          function isElementVisible(el: Element) {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
          }
          
          // Function to get text from an element and its position
          function getTextWithPosition(node: Node, chunks: TextChunk[], baseOffset = 0, idCounter = { value: 0 }) {
            // First check if this is an Element
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (!isElementVisible(element)) return baseOffset;
              
              // Skip script, style, and other non-content elements
              if (['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT'].includes(element.nodeName)) {
                return baseOffset;
              }
            }
            
            // Process text nodes
            if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) {
              const text = node.textContent.trim();
              if (text==='fancy-area')
                console.log('fancy-area', text); 
              if (text.length > 1) { // Only include text chunks with reasonable length
                chunks.push({
                  id: idCounter.value++,
                  text: text,
                  startOffset: baseOffset,
                  endOffset: baseOffset + text.length,
                  element: node.parentElement ? node.parentElement.nodeName : 'UNKNOWN'
                });
              }
              return baseOffset + (node.textContent?.length || 0);
            }
            
            // Process child nodes recursively
            let offset = baseOffset;
            for (let i = 0; i < node.childNodes.length; i++) {
              offset = getTextWithPosition(
                node.childNodes[i], // Don't cast to Element!
                chunks, 
                offset, 
                idCounter
              );
            }
            
            return offset;
          }
          
          // Start the extraction process
          const textChunks: TextChunk[] = [];
          getTextWithPosition(document.body, textChunks, 0, { value: 0 });
          
          return textChunks;
        }
      };
      
      // Execute the script to extract text
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        console.log('Using Chrome extension API to extract text');
        // Using Chrome extension API
        const results = await chrome.scripting.executeScript(extractionScript);
        const extractedChunks = results[0]?.result || [];
        setTextChunks(extractedChunks);
      } else {
        // Mock data for development or when browser APIs are unavailable
        setTextChunks([
          { id: 0, text: "This is a sample paragraph for testing the search functionality.", startOffset: 0, endOffset: 64, element: "P" },
          { id: 1, text: "Fuse.js provides a powerful search with typo tolerance.", startOffset: 65, endOffset: 120, element: "P" },
          { id: 2, text: "You can search for any text in the current webpage and find links to it.", startOffset: 121, endOffset: 190, element: "P" }
        ]);
      }
    } catch (error) {
      console.error('Failed to extract text from current tab:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  // Function to perform search
  const handleSearch = () => {
    if (!fuseInstance || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = fuseInstance.search(searchQuery);
    setSearchResults(results);
  };

  // Function to scroll to and highlight text in the original page
  const scrollToText = async (result: Fuse.FuseResult<TextChunk>) => {
    if (!currentTabId) return;
    
    const chunk = result.item;
    const highlightScript = {
      target: { tabId: currentTabId },
      function: (chunk: TextChunk, searchQuery: string) => {
        console.log(chunk, searchQuery)
        // Create a text finder function
        function findTextInPage(searchText: string, chunkText: string) {
          // Create a TreeWalker to iterate through all text nodes
          const treeWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                return node.textContent && node.textContent.includes(chunkText) 
                  ? NodeFilter.FILTER_ACCEPT 
                  : NodeFilter.FILTER_REJECT;
              }
            }
          );
          
          // Find the matching node
          let currentNode = treeWalker.nextNode();
          while (currentNode) {
            const range = document.createRange();
            range.selectNode(currentNode);
            
            // Find the specific text position within the node
            const nodeText = currentNode.textContent || '';
            const startPos = nodeText.indexOf(chunkText);
            
            if (startPos >= 0) {
              // Create a mark element to highlight the text
              const highlightEl = document.createElement('mark');
              highlightEl.style.backgroundColor = '#FFDE7D';
              highlightEl.style.color = '#000';
              highlightEl.id = 'quote-finder-highlight';
              
              // Set the text range
              range.setStart(currentNode, startPos);
              range.setEnd(currentNode, startPos + chunkText.length);
              
              // Replace the text with our highlighted version
              range.surroundContents(highlightEl);
              
              // Scroll the element into view
              highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Add a listener to remove the highlight on click
              highlightEl.addEventListener('click', () => {
                const parent = highlightEl.parentNode;
                if (parent) {
                  // Replace the highlight with original text
                  const text = highlightEl.textContent || '';
                  const textNode = document.createTextNode(text);
                  parent.replaceChild(textNode, highlightEl);
                }
              });
              
              return true;
            }
            
            currentNode = treeWalker.nextNode();
          }
          
          return false;
        }
        
        // Remove any existing highlights
        const existingHighlight = document.getElementById('quote-finder-highlight');
        if (existingHighlight) {
          const parent = existingHighlight.parentNode;
          if (parent) {
            const text = existingHighlight.textContent || '';
            const textNode = document.createTextNode(text);
            parent.replaceChild(textNode, existingHighlight);
          }
        }
        
        // Find and highlight the text
        const found = findTextInPage(searchQuery, chunk.text);
        
        // If exact match not found, try with the surrounding context
        if (!found) {
          alert('Could not locate the exact text. It might have changed or the page was updated.');
        }
        
        return found;
      },
      args: [chunk, searchQuery]
    };
    
    try {
      // Execute the script to highlight and scroll to text
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        await chrome.scripting.executeScript(highlightScript);
      } else {
        console.log('Browser APIs not available for highlighting text');
      }
    } catch (error) {
      console.error('Failed to highlight text:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // Auto-search after typing
    if (e.target.value.trim()) {
      const delaySearch = setTimeout(() => {
        handleSearch();
      }, 300);
      
      return () => clearTimeout(delaySearch);
    } else {
      setSearchResults([]);
    }
  };

  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0 && searchQuery.trim() !== '') {
      return (
        <Card className="mt-4">
          <CardContent className="pt-4">
            No results found for "{searchQuery}".
          </CardContent>
        </Card>
      );
    }

    return searchResults.map((result) => (
      <Card key={`result-${result.item.id}`} className="mt-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => scrollToText(result)}>
        <CardContent className="pt-4">
          <div className="font-medium">
            {highlightMatches(result)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Found in {result.item.element} element (score: {result.score?.toFixed(2)})
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Function to highlight matched parts of text
  const highlightMatches = (result: Fuse.FuseResult<TextChunk>) => {
    if (!result.matches || result.matches.length === 0) {
      return result.item.text;
    }

    const match = result.matches[0];
    if (!match || !match.indices || match.indices.length === 0) {
      return result.item.text;
    }

    const text = result.item.text;
    const indices = match.indices;
    
    let lastIndex = 0;
    const highlightedText: JSX.Element[] = [];
    
    indices.forEach(([start, end]) => {
      // Add text before the match
      if (start > lastIndex) {
        highlightedText.push(
          <span key={`text-${lastIndex}-${start}`}>{text.substring(lastIndex, start)}</span>
        );
      }
      
      // Add the highlighted match
      highlightedText.push(
        <span key={`match-${start}-${end}`} className="bg-yellow-200 dark:bg-yellow-800">
          {text.substring(start, end + 1)}
        </span>
      );
      
      lastIndex = end + 1;
    });
    
    // Add any remaining text
    if (lastIndex < text.length) {
      highlightedText.push(
        <span key={`text-${lastIndex}-${text.length}`}>{text.substring(lastIndex)}</span>
      );
    }
    
    return <>{highlightedText}</>;
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Find Quote in Page</h2>
      
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter text to find in page..."
          value={searchQuery}
          onChange={handleInputChange}
          disabled={isExtracting || textChunks.length === 0}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isExtracting || !searchQuery.trim() || textChunks.length === 0}>
          Search
        </Button>
        <Button variant="outline" onClick={extractTextFromCurrentTab} disabled={isExtracting}>
          {isExtracting ? 'Extracting...' : 'Refresh Content'}
        </Button>
      </div>
      
      {isExtracting && (
        <div className="mt-4 text-center">
          <p>Extracting text from current page...</p>
        </div>
      )}
      
      <div className="mt-2   text-muted-foreground">
        {textChunks.length > 0 ? 
          `${textChunks.length} text segments indexed from page` : 
          isExtracting ? '' : 'Click "Refresh Content" to extract text from the current page'
        }
      </div>
      
      <ScrollArea className="h-[400px] mt-4">
        {renderSearchResults()}
      </ScrollArea>
    </div>
  );
}

export default QuoteFinder;