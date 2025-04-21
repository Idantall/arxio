"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface CodeViewerProps {
  projectId: string;
}

// Mock file structure for demo purposes
// In a real app, this would be fetched from the API
const mockFileStructure: FileNode = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Header.jsx", type: "file", path: "src/components/Header.jsx" },
            { name: "Footer.jsx", type: "file", path: "src/components/Footer.jsx" },
          ],
        },
        {
          name: "pages",
          type: "folder",
          children: [
            { name: "index.js", type: "file", path: "src/pages/index.js" },
            { name: "about.js", type: "file", path: "src/pages/about.js" },
          ],
        },
        { name: "App.js", type: "file", path: "src/App.js" },
      ],
    },
    { name: "package.json", type: "file", path: "package.json" },
    { name: "README.md", type: "file", path: "README.md" },
  ],
};

// Mock file content for demo purposes
const mockFileContent = `// Example App.js file
import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  // Potential security issue: Using unvalidated data
  const userData = JSON.parse(localStorage.getItem('user_data'));
  
  // Potential security issue: Using dangerouslySetInnerHTML
  const renderHTML = (html) => {
    return { __html: html };
  };

  return (
    <div className="app">
      <Header user={userData} />
      <main>
        <h1>Welcome to our app!</h1>
        <div dangerouslySetInnerHTML={renderHTML(userData.bio)} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
`;

interface FileNode {
  name: string;
  type: "file" | "folder";
  path?: string;
  children?: FileNode[];
}

export function CodeViewer({ projectId }: CodeViewerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Handle file selection
  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    // In a real app, you'd fetch the file content from your API
    setFileContent(mockFileContent);
  };

  // Render the file tree recursively
  const renderTree = (node: FileNode, path: string = "") => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    
    if (node.type === "file") {
      return (
        <div 
          key={currentPath}
          className={`
            flex items-center py-1 px-2 cursor-pointer text-sm
            hover:bg-gray-100 rounded
            ${selectedFile === node.path ? 'bg-gray-100 text-blue-600' : ''}
          `}
          onClick={() => handleFileClick(node.path || currentPath)}
        >
          <File className="h-4 w-4 mr-2 text-gray-500" />
          {node.name}
        </div>
      );
    }
    
    const isExpanded = expandedFolders[currentPath] !== false; // Default to expanded
    
    return (
      <div key={currentPath}>
        <div 
          className="flex items-center py-1 px-2 cursor-pointer text-sm hover:bg-gray-100 rounded"
          onClick={() => toggleFolder(currentPath)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
          )}
          <Folder className="h-4 w-4 mr-2 text-blue-500" />
          {node.name}
        </div>
        
        {isExpanded && node.children && (
          <div className="pl-4">
            {node.children.map(child => renderTree(child, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div className="w-64 border-r overflow-auto p-2 h-full">
        {mockFileStructure.children?.map(node => renderTree(node))}
      </div>
      
      {/* Code Editor */}
      <div className="flex-1 h-full">
        {selectedFile ? (
          <MonacoEditor
            height="90vh"
            language={selectedFile.endsWith(".js") || selectedFile.endsWith(".jsx") ? "javascript" : 
                    selectedFile.endsWith(".ts") || selectedFile.endsWith(".tsx") ? "typescript" :
                    selectedFile.endsWith(".md") ? "markdown" :
                    selectedFile.endsWith(".json") ? "json" :
                    selectedFile.endsWith(".html") ? "html" :
                    selectedFile.endsWith(".css") ? "css" : "text"}
            theme="vs-dark"
            value={fileContent}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              automaticLayout: true,
              folding: true,
              lineDecorationsWidth: 10,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p>Select a file to view code</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 