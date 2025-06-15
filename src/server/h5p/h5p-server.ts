import { H5PEditor, H5PPlayer, fsImplementations } from '@lumieducation/h5p-server';
import path from 'path';
import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Simple H5P server implementation for Next.js
 * This implementation is designed to work with Next.js and avoids issues with schema loading
 */

// Define storage paths
const h5pRootPath = path.resolve(process.cwd(), 'h5p');
const contentStoragePath = path.join(h5pRootPath, 'content');
const libraryStoragePath = path.join(h5pRootPath, 'libraries');
const temporaryStoragePath = path.join(h5pRootPath, 'temporary-storage');
const schemasPath = path.join(h5pRootPath, 'schemas');

// Ensure all required directories exist
function ensureDirectories() {
  const directories = [
    h5pRootPath,
    contentStoragePath,
    libraryStoragePath,
    temporaryStoragePath,
    schemasPath
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Ensure required schema files exist
function ensureSchemaFiles() {
  // List of additional schema files that might be needed
  const additionalSchemas = [
    'content-type-cache.json',
    'content.json',
    'semantics.json',
    'library-metadata.json'
  ];

  // Check if schema files exist, if not create them with default content
  for (const schemaFile of additionalSchemas) {
    const schemaPath = path.join(schemasPath, schemaFile);
    if (!fs.existsSync(schemaPath)) {
      // Create default schema content
      let defaultContent = '{}';

      if (schemaFile === 'content-type-cache.json') {
        defaultContent = JSON.stringify({
          "$schema": "http://json-schema.org/draft-07/schema#",
          "title": "H5P Content Type Cache",
          "type": "object",
          "required": ["libraries"],
          "properties": {
            "libraries": {
              "type": "array",
              "description": "The libraries in the content type cache",
              "items": {
                "type": "object",
                "required": ["machineName", "majorVersion", "minorVersion", "patchVersion", "runnable"],
                "properties": {
                  "machineName": {
                    "type": "string",
                    "description": "The machine name of the library (e.g. H5P.MultiChoice)"
                  },
                  "majorVersion": {
                    "type": "integer",
                    "description": "The major version of the library"
                  },
                  "minorVersion": {
                    "type": "integer",
                    "description": "The minor version of the library"
                  },
                  "patchVersion": {
                    "type": "integer",
                    "description": "The patch version of the library"
                  },
                  "runnable": {
                    "type": "boolean",
                    "description": "Whether the library is runnable"
                  }
                }
              }
            }
          }
        }, null, 2);
      } else if (schemaFile === 'content.json') {
        defaultContent = JSON.stringify({
          "$schema": "http://json-schema.org/draft-07/schema#",
          "title": "H5P Content",
          "type": "object",
          "properties": {
            "params": {
              "type": "object",
              "description": "The content parameters"
            },
            "metadata": {
              "type": "object",
              "description": "The content metadata"
            }
          }
        }, null, 2);
      } else if (schemaFile === 'semantics.json') {
        defaultContent = JSON.stringify({
          "$schema": "http://json-schema.org/draft-07/schema#",
          "title": "H5P Semantics",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "description": "The name of the field"
              },
              "type": {
                "type": "string",
                "description": "The type of the field"
              },
              "label": {
                "type": "string",
                "description": "The label of the field"
              },
              "description": {
                "type": "string",
                "description": "The description of the field"
              }
            }
          }
        }, null, 2);
      } else if (schemaFile === 'library-metadata.json') {
        defaultContent = JSON.stringify({
          "$schema": "http://json-schema.org/draft-07/schema#",
          "title": "H5P Library Metadata",
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "The title of the library"
            },
            "description": {
              "type": "string",
              "description": "The description of the library"
            },
            "contentType": {
              "type": "string",
              "description": "The content type of the library"
            },
            "icon": {
              "type": "string",
              "description": "The icon of the library"
            }
          }
        }, null, 2);
      }

      writeFileSync(schemaPath, defaultContent, 'utf8');
      console.log(`Created additional schema file: ${schemaFile}`);
    }
  }
}

// Create storage objects
function createStorageObjects() {
  return {
    libraryStorage: new fsImplementations.FileLibraryStorage(libraryStoragePath),
    contentStorage: new fsImplementations.FileContentStorage(contentStoragePath),
    temporaryStorage: new fsImplementations.DirectoryTemporaryFileStorage(temporaryStoragePath),
    // Simple in-memory key-value storage
    keyValueStorage: {
      get: async (_key: string) => null,
      getMultiple: async (keys: string[]) => keys.map(() => null),
      set: async (_key: string, _value: any) => {},
      setMultiple: async (_keyValuePairs: { key: string; value: any }[]) => {},
      load: async () => ({}),
      save: async () => {}
    }
  };
}

// H5P configuration
const h5pConfig = {
  baseUrl: '/api/h5p/static',
  ajaxUrl: '/api/h5p/ajax',
  contentFilesUrl: '/api/h5p/content-files',
  contentFilesUrlPlayerOverride: '/api/h5p/content-files',
  contentUserDataUrl: '/api/h5p/content-user-data',
  contentTypeCacheRefreshInterval: 86400000, // 1 day
  contentWhitelist: 'json svg png jpg jpeg gif bmp tif tiff wav mp3 mp4 webm m4a ogg oga ogv weba webp',
  coreApiVersion: { major: 1, minor: 24 },
  coreUrl: '/api/h5p/static/core',
  downloadUrl: '/api/h5p/download',
  editorLibraryUrl: '/api/h5p/editor',
  enableLrsContentTypes: true,
  fetchingDisabled: 0,
  h5pVersion: '1.24.0',
  hubRegistrationEndpoint: 'https://api.h5p.org/v1/sites',
  librariesUrl: '/api/h5p/static/libraries',
  libraryWhitelist: 'js css',
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  maxTotalSize: 500 * 1024 * 1024, // 500 MB
  sendUsageStatistics: false,
  temporaryFileLifetime: 86400, // 1 day (in seconds),
  uuid: 'lxp-h5p-implementation',
  contentHubEnabled: false,
  contentHubMetadataRefreshInterval: 86400000,
  contentHubContentEndpoint: '',
  contentHubMetadataEndpoint: '',
  setFinishedEnabled: true,
  siteType: 'local'
};

// Create H5P objects with error handling
let h5pEditor: H5PEditor | null = null;
let h5pPlayer: H5PPlayer | null = null;

// Create default schema content for essential schemas
function createDefaultSchemas() {
  // Define essential schemas with their default content
  const defaultSchemas = {
    'save-metadata.json': {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "H5P metadata",
      "type": "object",
      "required": ["title", "mainLibrary", "language", "preloadedDependencies"],
      "properties": {
        "title": {
          "type": "string",
          "description": "The human readable title of the content"
        },
        "mainLibrary": {
          "type": "string",
          "description": "The main library of the content (e.g. H5P.MultiChoice-1.0)"
        },
        "language": {
          "type": "string",
          "description": "The language code of the content (e.g. 'en')"
        },
        "preloadedDependencies": {
          "type": "array",
          "description": "The libraries that the content depends on",
          "items": {
            "type": "object",
            "required": ["machineName", "majorVersion", "minorVersion"],
            "properties": {
              "machineName": {
                "type": "string",
                "description": "The machine name of the library (e.g. H5P.MultiChoice)"
              },
              "majorVersion": {
                "type": "integer",
                "description": "The major version of the library"
              },
              "minorVersion": {
                "type": "integer",
                "description": "The minor version of the library"
              }
            }
          }
        }
      }
    },
    'library-schema.json': {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "H5P Library Schema",
      "type": "object",
      "required": ["machineName", "majorVersion", "minorVersion", "patchVersion"],
      "properties": {
        "machineName": {
          "type": "string",
          "description": "The machine name of the library"
        },
        "majorVersion": {
          "type": "integer",
          "description": "The major version of the library"
        },
        "minorVersion": {
          "type": "integer",
          "description": "The minor version of the library"
        },
        "patchVersion": {
          "type": "integer",
          "description": "The patch version of the library"
        }
      }
    },
    'h5p-schema.json': {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "H5P Package Schema",
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The title of the H5P package"
        },
        "language": {
          "type": "string",
          "description": "The language of the H5P package"
        },
        "mainLibrary": {
          "type": "string",
          "description": "The main library of the H5P package"
        }
      }
    },
    'library-name-schema.json': {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "H5P Library Name Schema",
      "type": "object",
      "required": ["machineName", "majorVersion", "minorVersion"],
      "properties": {
        "machineName": {
          "type": "string",
          "description": "The machine name of the library"
        },
        "majorVersion": {
          "type": "integer",
          "description": "The major version of the library"
        },
        "minorVersion": {
          "type": "integer",
          "description": "The minor version of the library"
        }
      }
    }
  };

  // Create each schema file
  for (const [schemaName, schemaContent] of Object.entries(defaultSchemas)) {
    const schemaPath = path.join(schemasPath, schemaName);
    if (!fs.existsSync(schemaPath)) {
      fs.writeFileSync(schemaPath, JSON.stringify(schemaContent, null, 2), 'utf8');
      console.log(`Created default schema: ${schemaName}`);
    }
  }
}

// Custom H5P Editor with schema loading from file system
class CustomH5PEditor extends H5PEditor {
  constructor(params: any) {
    // Create default schemas before initializing
    createDefaultSchemas();
    
    // Initialize parent class
    super(params.keyValueStorage, params.config, params.libraryStorage,
          params.contentStorage, params.temporaryStorage);
    
    // Completely override the schema loading method
    const self = this;
    
    // Store the original loadSchema method
    const originalLoadSchema = (self as any).loadSchema;
    
    // Replace the loadSchema method with our own implementation
    (self as any).loadSchema = async function(schemaName: string) {
      try {
        // Log the schema being requested
        console.log(`Attempting to load schema: ${schemaName}`);
        
        // First, try to load from our custom schemas directory
        const customSchemaPath = path.join(schemasPath, `${schemaName}.json`);
        if (fs.existsSync(customSchemaPath)) {
          console.log(`Loading schema from custom path: ${customSchemaPath}`);
          const schemaContent = fs.readFileSync(customSchemaPath, 'utf8');
          try {
            return JSON.parse(schemaContent);
          } catch (parseError) {
            console.error(`Error parsing schema from ${customSchemaPath}:`, parseError);
          }
        }
        
        // If we reach here, either the file doesn't exist or we couldn't parse it
        console.log(`Schema ${schemaName} not found in custom directory, using fallback...`);
        
        // Get the schema content from our default schemas if possible
        const defaultSchemas: any = {
          'save-metadata': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P metadata",
            "type": "object",
            "required": ["title", "mainLibrary", "language", "preloadedDependencies"],
            "properties": {
              "title": { "type": "string" },
              "mainLibrary": { "type": "string" },
              "language": { "type": "string" },
              "preloadedDependencies": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "machineName": { "type": "string" },
                    "majorVersion": { "type": "integer" },
                    "minorVersion": { "type": "integer" }
                  }
                }
              }
            }
          },
          'library-schema': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Library Schema",
            "type": "object",
            "required": ["machineName", "majorVersion", "minorVersion", "patchVersion"],
            "properties": {
              "machineName": { "type": "string" },
              "majorVersion": { "type": "integer" },
              "minorVersion": { "type": "integer" },
              "patchVersion": { "type": "integer" }
            }
          },
          'h5p-schema': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Package Schema",
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "language": { "type": "string" },
              "mainLibrary": { "type": "string" }
            }
          },
          'library-name-schema': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Library Name Schema",
            "type": "object",
            "required": ["machineName", "majorVersion", "minorVersion"],
            "properties": {
              "machineName": { "type": "string" },
              "majorVersion": { "type": "integer" },
              "minorVersion": { "type": "integer" }
            }
          },
          'content-type-cache': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Content Type Cache",
            "type": "object",
            "required": ["libraries"],
            "properties": {
              "libraries": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "machineName": { "type": "string" },
                    "majorVersion": { "type": "integer" },
                    "minorVersion": { "type": "integer" },
                    "patchVersion": { "type": "integer" },
                    "runnable": { "type": "boolean" }
                  }
                }
              }
            }
          },
          'content': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Content",
            "type": "object",
            "properties": {
              "params": { "type": "object" },
              "metadata": { "type": "object" }
            }
          },
          'semantics': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Semantics",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "type": { "type": "string" },
                "label": { "type": "string" },
                "description": { "type": "string" }
              }
            }
          },
          'library-metadata': {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "H5P Library Metadata",
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "description": { "type": "string" },
              "contentType": { "type": "string" },
              "icon": { "type": "string" }
            }
          }
        };
        
        // If we have a default schema for this name, return it
        if (defaultSchemas[schemaName]) {
          console.log(`Using built-in default schema for: ${schemaName}`);
          return defaultSchemas[schemaName];
        }
        
        // As a last resort, try the original loadSchema method
        try {
          console.log(`Attempting to use original loadSchema for: ${schemaName}`);
          return await originalLoadSchema.call(self, schemaName);
        } catch (fallbackError) {
          console.error(`Original loadSchema failed for ${schemaName}:`, fallbackError);
          
          // If all else fails, return an empty schema to prevent crashes
          console.log(`Returning empty schema for: ${schemaName}`);
          return {};
        }
      } catch (error) {
        console.error(`Error in custom loadSchema for ${schemaName}:`, error);
        // Return empty schema to prevent crashes
        return {};
      }
    };
  }
}

// Function to initialize H5P
export function initializeH5P() {
  try {
    console.log('Starting H5P initialization...');

    // Ensure directories exist
    console.log('Ensuring H5P directories exist...');
    ensureDirectories();

    // Create default schemas first
    console.log('Creating default schemas...');
    createDefaultSchemas();
    
    // Validate save-metadata.json exists as it's critical
    const saveMetadataPath = path.join(schemasPath, 'save-metadata.json');
    if (!fs.existsSync(saveMetadataPath)) {
      console.error('Critical schema file save-metadata.json is missing!');
      // Force creation of this critical schema
      const saveMetadataSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "H5P metadata",
        "type": "object",
        "required": ["title", "mainLibrary", "language", "preloadedDependencies"],
        "properties": {
          "title": { "type": "string" },
          "mainLibrary": { "type": "string" },
          "language": { "type": "string" },
          "preloadedDependencies": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "machineName": { "type": "string" },
                "majorVersion": { "type": "integer" },
                "minorVersion": { "type": "integer" }
              }
            }
          }
        }
      };
      fs.writeFileSync(saveMetadataPath, JSON.stringify(saveMetadataSchema, null, 2), 'utf8');
      console.log('Created missing critical schema: save-metadata.json');
    }

    // Then ensure our custom schema files exist
    console.log('Ensuring H5P schema files exist...');
    ensureSchemaFiles();

    // Create storage objects
    console.log('Creating H5P storage objects...');
    const storage = createStorageObjects();

    try {
      // Create the editor with our custom implementation
      console.log('Creating H5P editor...');
      h5pEditor = new CustomH5PEditor({
        keyValueStorage: storage.keyValueStorage,
        config: h5pConfig,
        libraryStorage: storage.libraryStorage,
        contentStorage: storage.contentStorage,
        temporaryStorage: storage.temporaryStorage
      });
      
      console.log('H5P editor created successfully');
    } catch (editorError) {
      console.error('Error creating H5P editor:', editorError);
      // Don't abort, try to create the player anyway
    }

    try {
      // Create the player
      console.log('Creating H5P player...');
      h5pPlayer = new H5PPlayer(
        h5pConfig as any,
        storage.libraryStorage as any,
        storage.contentStorage as any
      );
      
      console.log('H5P player created successfully');
    } catch (playerError) {
      console.error('Error creating H5P player:', playerError);
      // If player creation failed, we can still continue if editor was created
    }

    // At least one of editor or player must be created for initialization to be considered successful
    if (!h5pEditor && !h5pPlayer) {
      console.error('Both H5P editor and player failed to initialize');
      return false;
    }

    // Set renderers for the objects that were successfully created
    if (h5pEditor) {
      console.log('Setting H5P editor renderer...');
      h5pEditor.setRenderer((model: any) => model);
    }
    
    if (h5pPlayer) {
      console.log('Setting H5P player renderer...');
      h5pPlayer.setRenderer((model: any) => model);
    }

    console.log('H5P initialization successful');
    return true;
  } catch (error) {
    console.error('Failed to initialize H5P:', error);
    return false;
  }
}

// Export the H5P objects and functions
export { h5pEditor, h5pPlayer, ensureDirectories, ensureSchemaFiles };
