export interface ChatMessage {
  text: string;
  timestamp: Date;
  type: 'user' | 'bot';
  fetchedData?: any[]; // Optional field for table data
  debugInfo?: {
    sqlQuery?: string;
    requestTime?: number; // in milliseconds
  };
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  chat_id: string;
  sql_query: string;
  additional_information: string;
  fetched_data: any; // Placeholder for fetched data
} 