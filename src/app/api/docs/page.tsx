"use client";

import { useState } from "react";
import { api } from "../../../trpc/react";

// Define types for the OpenAPI specification
interface OpenAPIInfo {
  title: string;
  version: string;
  description: string;
}

interface OpenAPIComponents {
  schemas: Record<string, unknown>;
}

interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  paths: Record<string, unknown>;
  components: OpenAPIComponents;
}

/**
 * API Documentation Page
 * Displays the OpenAPI specification for the API
 */
export default function ApiDocsPage() {
  const [selectedRouter, setSelectedRouter] = useState<string | null>(null);
  const [jsonView, setJsonView] = useState(false);

  // Fetch the full OpenAPI spec
  const { data: fullSpec, isLoading: isLoadingFull } = api.docs.getOpenAPISpec.useQuery();

  // Fetch router-specific docs when a router is selected
  const { data: routerSpec, isLoading: isLoadingRouter } = api.docs.getRouterDocs.useQuery(
    { routerName: selectedRouter || "" },
    { enabled: !!selectedRouter }
  );

  // Get the list of available routers
  const routers = fullSpec ? 
    Object.keys((fullSpec.paths as Record<string, unknown>) || {})
      .map(path => path.split("/")[1])
      .filter((value, index, self) => self.indexOf(value) === index)
    : [];

  // Get the spec to display (either full or router-specific)
  const displaySpec = selectedRouter ? routerSpec : fullSpec;
  const isLoading = selectedRouter ? isLoadingRouter : isLoadingFull;

  // Cast the display spec to the OpenAPISpec type
  const typedSpec = displaySpec as OpenAPISpec | undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      
      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          <select
            className="border rounded px-3 py-2"
            value={selectedRouter || ""}
            onChange={(e) => setSelectedRouter(e.target.value || null)}
          >
            <option value="">All Routers</option>
            {routers.map((router) => (
              <option key={router} value={router}>
                {router}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={jsonView}
              onChange={() => setJsonView(!jsonView)}
              className="form-checkbox"
            />
            <span>JSON View</span>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : typedSpec ? (
        jsonView ? (
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[70vh]">
            {JSON.stringify(typedSpec, null, 2)}
          </pre>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-2">{typedSpec.info?.title}</h2>
              <p className="text-gray-600 mb-4">{typedSpec.info?.description}</p>
              <div className="text-sm text-gray-500">Version: {typedSpec.info?.version}</div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Endpoints</h3>
              
              {Object.entries(typedSpec.paths || {}).map(([path, methods]) => (
                <div key={path} className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-lg font-medium mb-4">{path}</h4>
                  
                  {Object.entries(methods as Record<string, unknown>).map(([method, details]) => (
                    <div key={`${path}-${method}`} className="mb-6 last:mb-0">
                      <div className="flex items-center mb-2">
                        <span className={`uppercase font-mono px-2 py-1 rounded text-xs mr-2 ${
                          method === 'get' ? 'bg-blue-100 text-blue-800' : 
                          method === 'post' ? 'bg-green-100 text-green-800' : 
                          method === 'put' ? 'bg-yellow-100 text-yellow-800' : 
                          method === 'delete' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {method}
                        </span>
                        <span className="font-semibold">{(details as any).summary}</span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{(details as any).description}</p>
                      
                      {(details as any).tags && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(details as any).tags.map((tag: string) => (
                            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {(details as any).deprecated && (
                        <div className="bg-yellow-50 text-yellow-800 px-3 py-2 rounded mb-3 text-sm">
                          This endpoint is deprecated.
                        </div>
                      )}
                      
                      {(details as any).requestBody && (
                        <div className="mb-3">
                          <h5 className="font-medium mb-1">Request Body</h5>
                          <div className="bg-gray-50 p-3 rounded">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify((details as any).requestBody, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                      
                      {(details as any).responses && (
                        <div>
                          <h5 className="font-medium mb-1">Responses</h5>
                          <div className="bg-gray-50 p-3 rounded">
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify((details as any).responses, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {typedSpec.components?.schemas && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Schemas</h3>
                
                {Object.entries(typedSpec.components.schemas || {}).map(([name, schema]) => (
                  <div key={name} className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-medium mb-2">{name}</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(schema, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded">
          No documentation available. Make sure your API routers are properly documented.
        </div>
      )}
    </div>
  );
} 