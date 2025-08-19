import { Component, signal, ViewChild, ElementRef, AfterViewChecked, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DaverApi } from '../../services/daver-api';
import { ChatMessage } from '../../models/chat.model';
import { DataTable } from '../../components/data-table/data-table';

@Component({
  selector: 'daver-chat',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
    TextFieldModule,
    DataTable
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss'
})
export class Chat implements AfterViewChecked {
  @ViewChild('chatMessages') chatMessages!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  userInput = signal('');
  errorMessage = signal<string | null>(null);
  debugMode = signal(true);
  lastUserMessage = signal<string>(''); // Store the last user message for retry
  previousMessageCount = signal(0); // Track previous message count for scroll behavior

  private daverApi = inject(DaverApi);

  // Computed property to get all messages in chronological order
  allMessages = computed(() => {
    return this.messages().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  ngAfterViewChecked() {
    // Only scroll to bottom if new messages were added
    const currentMessageCount = this.messages().length;
    if (currentMessageCount > this.previousMessageCount()) {
      this.scrollToBottom();
      this.previousMessageCount.set(currentMessageCount);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter creates a new line (default behavior)
        return;
      } else {
        // Enter sends the message
        event.preventDefault();
        this.sendMessage();
      }
    }
  }

  sendMessage(): void {
    if (!this.userInput().trim() || this.isLoading()) {
      return;
    }

    // Clear any previous errors
    this.errorMessage.set(null);

    // Store the user message for potential retry
    const userMessageText = this.userInput().trim();
    this.lastUserMessage.set(userMessageText);

    // Add user message
    const userMessage: ChatMessage = {
      text: userMessageText,
      timestamp: new Date(),
      type: 'user'
    };
    this.messages.update(messages => [...messages, userMessage]);

    // Clear input
    this.userInput.set('');

    // Send the message
    this.sendMessageToServer(userMessageText);
  }

  retryLastMessage(): void {
    if (!this.lastUserMessage() || this.isLoading()) {
      return;
    }

    // Clear any previous errors
    this.errorMessage.set(null);

    // Add user message again
    const userMessage: ChatMessage = {
      text: this.lastUserMessage(),
      timestamp: new Date(),
      type: 'user'
    };
    this.messages.update(messages => [...messages, userMessage]);

    // Send the message again
    this.sendMessageToServer(this.lastUserMessage());
  }

  private sendMessageToServer(messageText: string): void {
    // Show loading state
    this.isLoading.set(true);

    // Track request start time for debug mode
    const requestStartTime = Date.now();

    // Send message to server
    this.daverApi.sendChatMessage(messageText).subscribe({
      next: (response) => {
        // Calculate request time
        const requestTime = Date.now() - requestStartTime;
        
        // Extract the result array from fetched_data
        const resultData = response.fetched_data?.result || [];
        const hasData = Array.isArray(resultData) && resultData.length > 0;
        const hasAdditionalInfo = response.additional_information && response.additional_information.trim();
        
        // Determine what text to show
        let botText = '';
        if (hasData) {
          // If we have data, show success message or additional info
          botText = hasAdditionalInfo ? response.additional_information : 'Here are the results:';
        } else {
          // If no data, show appropriate message
          botText = hasAdditionalInfo ? response.additional_information : 'No data found for your query.';
        }
        
        // Prepare debug info if debug mode is enabled
        const debugInfo = this.debugMode() ? {
          sqlQuery: response.sql_query,
          requestTime: requestTime
        } : undefined;
        
        const botResponse: ChatMessage = {
          text: botText,
          timestamp: new Date(),
          type: 'bot',
          fetchedData: hasData ? resultData : undefined,
          debugInfo: debugInfo
        };
        this.messages.update(messages => [...messages, botResponse]);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Chat message failed:', error);
        this.isLoading.set(false);
        
        // Calculate request time for error case
        const requestTime = Date.now() - requestStartTime;
        
        // Extract detailed error message from response
        let errorText = this.getErrorMessage(error);
        
        // Try to get detailed error from response body
        if (error.error && error.error.detail) {
          errorText = error.error.detail;
        } else if (error.detail) {
          errorText = error.detail;
        }
        
        // Add error message from bot
        const errorResponse: ChatMessage = {
          text: errorText,
          timestamp: new Date(),
          type: 'bot',
          debugInfo: this.debugMode() ? { requestTime: requestTime } : undefined
        };
        this.messages.update(messages => [...messages, errorResponse]);
      }
    });
  }

  private getErrorMessage(error: any): string {
    // If we have a detailed error message from the server, use it
    if (error.error && error.error.detail) {
      return error.error.detail;
    }
    
    if (error.detail) {
      return error.detail;
    }
    
    // Fallback to generic error messages based on status
    if (error.status === 0) {
      return 'Network error. Please check your connection and try again.';
    } else if (error.status === 400) {
      return 'Invalid message format. Please try rephrasing your question.';
    } else if (error.status === 404) {
      return 'Service not found. Please check if the server is running.';
    } else if (error.status >= 500) {
      return 'Server error. Please try again later.';
    } else if (error.message) {
      return error.message;
    } else {
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.chatMessages.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      // Handle error if element is not available
    }
  }
}
