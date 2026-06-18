import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { parseRawEventData, RawEventData } from './schemas';

/**
 * Load and validate event data from JSON file
 * Executed once at startup with fail-fast behavior
 * 
 * @throws Error if JSON file cannot be read
 * @throws ZodError if JSON fails schema validation
 */
export async function loadEventData(): Promise<RawEventData> {
  try {
    // Resolve path relative to repository root
    const dataFilePath = path.resolve(process.cwd(), 'codeandcomedy-talks.json');
    
    const fileContent = await fsPromises.readFile(dataFilePath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    
    // Validate against schema (will throw if invalid)
    const validated = parseRawEventData(rawData);
    
    return validated;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Synchronous variant for startup (if needed)
 */
export function loadEventDataSync(): RawEventData {
  try {
    const dataFilePath = path.resolve(process.cwd(), 'codeandcomedy-talks.json');
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    const rawData = JSON.parse(fileContent);
    return parseRawEventData(rawData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
    throw error;
  }
}
